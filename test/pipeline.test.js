'use strict'

const os = require('os')
const { join } = require('path')
const { once } = require('events')
const { test } = require('tap')
const { createTcpListener } = require('pino-socket/test/utils')
const pino = require('pino')

const pinoSyslog = join(__dirname, '..', 'lib', 'transport.js')

const messages = require(join(__dirname, 'fixtures', 'messages'))

function getConfigPath () {
  const cpath = join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
  return require(cpath)
}

test('pino pipeline', t => {
  t.plan(4)
  const destination = join(os.tmpdir(), 'pino-transport-test.log')

  const expected = [
    '<134>1 2018-02-03T01:20:00Z MacBook-Pro-3 - 94473 - - ',
    '<134>1 2018-02-10T01:20:00Z MacBook-Pro-3 - 94473 - - '
  ]

  createTcpListener(msg => {
    msg.split('\n')
      .filter(line => line) // skip empty lines
      .forEach(line => {
        t.ok(line.startsWith(expected.shift()))
      })
  }).then((serverSocket) => {
    t.teardown(() => {
      serverSocket.close()
      serverSocket.unref()
      transport.end()
    })

    const address = serverSocket.address().address
    const port = serverSocket.address().port

    const transport = pino.transport({
      pipeline: [
        {
          target: pinoSyslog,
          level: 'info',
          options: {
            ...getConfigPath('5424', 'newline.json')
          }
        },
        {
          target: 'pino-socket',
          options: {
            mode: 'tcp',
            address,
            port
          }
        }
      ]
    })
    const log = pino(transport)
    t.pass('built pino')
    return once(transport, 'ready').then(() => log)
  }).then(log => {
    t.pass('transport ready ' + destination)

    log.info(JSON.parse(messages.leadingDay))
    log.debug(JSON.parse(messages.helloWorld)) // it is skipped
    log.info(JSON.parse(messages.trailingDay))
  })
    .catch((err) => {
      t.fail(err)
    })
})
