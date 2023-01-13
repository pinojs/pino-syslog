'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test
const { join } = path
const os = require('os')
const fs = require('fs')
const pino = require('pino')
const { once } = require('events')

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

test('returns error for overly long rfc3164 messages', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: @cee: {"level":30,"time":1459529098958,"msg":"message exceeded syslog 1024 byte limit","originalSize":1110}'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'cee.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.stupidLong + '\n')
})

test('formats to message only', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'messageOnly.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets application name', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 test[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'appname.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets facility', (t) => {
  t.plan(1)
  const expected = '<6>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'facility.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('format timestamp with leading zero in days', (t) => {
  t.plan(1)
  const expected = '<134>Feb  3 02:20:00 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'date.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.leadingDay + '\n')
})

test('format timestamp with trailing zero in days', (t) => {
  t.plan(1)
  const expected = '<134>Feb 10 02:20:00 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'date.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.trailingDay + '\n')
})

test('sets timezone', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 12:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'tz.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('prepends `@cee `', (t) => {
  t.plan(1)
  const header = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: @cee: '
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'cee.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, header + messages.helloWorld)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('does not prepend `@cee ` for non-json messages', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'ceeMessageOnly.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('truncates overly long message only log', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: ' + JSON.parse(messages.stupidLong).msg.substr(0, 976)
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'messageOnly.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.equal(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.stupidLong + '\n')
})

test('appends newline', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: ' + messages.helloWorld + '\n'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'newline.json')])

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

test('syslog pino transport test rfc3164', { only: true }, async t => {
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
