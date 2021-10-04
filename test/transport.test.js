'use strict'

const os = require('os')
const fs = require('fs')
const { join } = require('path')
const { once } = require('events')
const { promisify } = require('util')
const { spawnSync } = require('child_process')
const { test } = require('tap')
const { createTcpListener } = require('pino-socket/test/utils')
const pino = require('pino')

const pinoSyslog = join(__dirname, '..', 'lib', 'transport.js')
const timeout = promisify(setTimeout)

const messages = require(join(__dirname, 'fixtures', 'messages'))

function getConfigPath () {
  const cpath = join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
  return require(cpath)
}

test('syslog pino transport test rfc3164', async t => {
  const destination = join(os.tmpdir(), 'pino-transport-test.log')

  const fd = fs.openSync(destination, 'w+')
  const sysLogOptions = {
    destination: fd,
    enablePipelining: false,
    ...getConfigPath('3164', 'newline.json')
  }

  const transport = pino.transport({
    target: pinoSyslog,
    level: 'info',
    options: sysLogOptions
  })
  const log = pino(transport)
  t.pass('built pino')
  await once(transport, 'ready')
  t.pass('transport ready ' + destination)

  log.info(JSON.parse(messages.leadingDay))
  log.debug(JSON.parse(messages.helloWorld)) // it is skipped
  log.info(JSON.parse(messages.trailingDay))

  await timeout(1000)

  const data = fs.readFileSync(destination, 'utf8').trim().split('\n')
  t.ok(data[0].startsWith('<134>Feb  3 01:20:00 MacBook-Pro-3 none[94473]: '), true, 'first line leadingDay')
  t.ok(data[1].startsWith('<134>Feb 10 01:20:00 MacBook-Pro-3 none[94473]: '), true, 'first line trailingDay')
})

test('syslog pino transport test rfc5424', async t => {
  const destination = join(os.tmpdir(), 'pino-transport-test.log')

  const fd = fs.openSync(destination, 'w+')
  const sysLogOptions = {
    destination: fd,
    enablePipelining: false,
    ...getConfigPath('5424', 'newline.json')
  }

  const transport = pino.transport({
    target: pinoSyslog,
    level: 'info',
    options: sysLogOptions
  })
  const log = pino(transport)
  t.pass('built pino')
  await once(transport, 'ready')
  t.pass('transport ready ' + destination)

  log.info(JSON.parse(messages.leadingDay))
  log.debug(JSON.parse(messages.helloWorld)) // it is skipped
  log.info(JSON.parse(messages.trailingDay))

  await timeout(1000)

  const data = fs.readFileSync(destination, 'utf8').trim().split('\n')
  t.ok(data[0].startsWith('<134>1 2018-02-03T01:20:00Z MacBook-Pro-3 - 94473 - - '), 'first line leadingDay')
  t.ok(data[1].startsWith('<134>1 2018-02-10T01:20:00Z MacBook-Pro-3 - 94473 - - '), 'first line trailingDay')
})

test('syslog pino transport test stdout', async t => {
  const result = spawnSync('node', ['--no-warnings', join(__dirname, 'fixtures', 'log-stdout.js'), '1'], {
    cwd: process.cwd()
  })
  t.equal(result.stdout.toString().trim(), '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - hello world')
  t.equal(result.status, 0)
})

test('syslog pino transport test stderr', async t => {
  const result = spawnSync('node', ['--no-warnings', join(__dirname, 'fixtures', 'log-stdout.js'), '2'], {
    cwd: process.cwd()
  })
  t.equal(result.stderr.toString().trim(), '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - hello world')
  t.equal(result.status, 0)
})

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
  })
    .then((serverSocket) => {
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
