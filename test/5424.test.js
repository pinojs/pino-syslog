'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test
const os = require('os')
const fs = require('fs')
const pino = require('pino')
const { once } = require('events')

const join = path.join
const { promisify } = require('util')
const timeout = promisify(setTimeout)

const messages = require(path.join(__dirname, 'fixtures', 'messages'))
const psyslogPath = path.join(path.resolve(__dirname, '..', 'psyslog'))

function configPath () {
  return path.join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
}

test('skips non-json input', (t) => {
  t.plan(1)
  const psyslog = spawn('node', [psyslogPath])

  psyslog.stdout.on('data', (data) => {
    t.fail('should not receive any data')
  })

  psyslog.on('close', (code) => {
    t.equal(code, 0)
  })

  psyslog.stdin.end('this is not json\n')
})

test('hello world', (t) => {
  t.plan(1)
  const header = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - '
  const psyslog = spawn('node', [psyslogPath])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, header + messages.helloWorld)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('formats to message only', (t) => {
  t.plan(1)
  const expected = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('5424', 'messageOnly.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets application name', (t) => {
  t.plan(1)
  const expected = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 test 94473 - - hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('5424', 'appname.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets facility', (t) => {
  t.plan(1)
  const expected = '<6>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('5424', 'facility.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets timezone', (t) => {
  t.plan(1)
  const expected = '<134>1 2016-04-01T12:44:58-04:00 MacBook-Pro-3 - 94473 - - hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('5424', 'tz.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('prepends `@cee `', (t) => {
  t.plan(1)
  const header = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - @cee: '
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('5424', 'cee.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, header + messages.helloWorld)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('does not prepend `@cee ` for non-json messages', (t) => {
  t.plan(1)
  const expected = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('5424', 'ceeMessageOnly.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('appends newline', (t) => {
  t.plan(1)
  const expected = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - ' + messages.helloWorld + '\n'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('5424', 'newline.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('uses structured data', (t) => {
  t.plan(1)
  const expected = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - [a@b x="y"] ' + messages.helloWorld
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('5424', 'structuredData.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

function getConfigPath () {
  const cpath = join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
  return require(cpath)
}

const pinoSyslog = join(__dirname, '..', 'lib', 'transport.js')

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
