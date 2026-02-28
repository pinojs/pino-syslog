'use strict'

const test = require('node:test')
const os = require('node:os')
const { join } = require('node:path')
const { once } = require('node:events')
const { createTcpListener } = require('pino-socket/test/utils')
const pino = require('pino')

const pinoSyslog = join(__dirname, '..', 'lib', 'transport.js')

const messages = require(join(__dirname, 'fixtures', 'messages'))

function getConfigPath () {
  const cpath = join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
  return require(cpath)
}

test('pino pipeline', (t, done) => {
  t.plan(4)
  const destination = join(os.tmpdir(), 'pino-transport-test.pipeline.log')

  const expected = [
    '<134>1 2018-02-03T01:20:00Z MacBook-Pro-3 - 94473 - - ',
    '<134>1 2018-02-10T01:20:00Z MacBook-Pro-3 - 94473 - - '
  ]

  let count = 0
  createTcpListener(msg => {
    count++

    msg.split('\n')
      .filter(line => line) // skip empty lines
      .forEach(line => {
        t.assert.ok(line.startsWith(expected.shift()))
      })

    if (count >= 2) done()
  })
    .then((serverSocket) => {
      t.after(() => {
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
      t.assert.ok('built pino')
      return once(transport, 'ready').then(() => log)
    })
    .then(log => {
      t.assert.ok('transport ready ' + destination)

      log.info(JSON.parse(messages.leadingDay))
      log.debug(JSON.parse(messages.helloWorld)) // it is skipped
      log.info(JSON.parse(messages.trailingDay))
    })
    .catch((err) => {
      t.fail(err)
    })
})
