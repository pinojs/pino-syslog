'use strict'

const test = require('node:test')
const path = require('node:path')
const os = require('node:os')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
const { once } = require('node:events')
const { setTimeout: timeout } = require('node:timers/promises')
const pino = require('pino')

const { join } = path
const messages = require(path.join(__dirname, 'fixtures', 'messages'))
const psyslogPath = path.join(path.resolve(__dirname, '..', 'psyslog'))

function configPath () {
  return path.join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
}

test('skips non-json input', (t, done) => {
  t.plan(1)
  const psyslog = spawn('node', [psyslogPath])

  psyslog.stdout.on('data', (data) => {
    t.fail('should not receive any data')
  })

  psyslog.on('close', (code) => {
    t.assert.equal(code, 0)
    done()
  })

  psyslog.stdin.end('this is not json\n')
})

test('returns error for overly long rfc3164 messages', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: @cee: {"level":30,"time":1459529098958,"msg":"message exceeded syslog 1024 byte limit","originalSize":1110}'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'cee.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.stupidLong + '\n')
})

test('formats to message only', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'messageOnly.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets application name', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 test[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'appname.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets facility', (t, done) => {
  t.plan(1)
  const expected = '<6>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'facility.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('format timestamp with leading zero in days', (t, done) => {
  t.plan(1)
  const expected = '<134>Feb  3 02:20:00 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'date.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.leadingDay + '\n')
})

test('format timestamp with trailing zero in days', (t, done) => {
  t.plan(1)
  const expected = '<134>Feb 10 02:20:00 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'date.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.trailingDay + '\n')
})

test('sets timezone', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 12:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'tz.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('prepends `@cee `', (t, done) => {
  t.plan(1)
  const header = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: @cee: '
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'cee.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, header + messages.helloWorld)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('does not prepend `@cee ` for non-json messages', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'ceeMessageOnly.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('truncates overly long message only log', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: ' + JSON.parse(messages.stupidLong).msg.substr(0, 976)
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'messageOnly.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.stupidLong + '\n')
})

test('appends newline', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: ' + messages.helloWorld + '\n'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'newline.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('write synchronously', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: ' + messages.helloWorld
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'sync.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets customLevels', (t, done) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 test[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'appname.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.assert.equal(msg, expected)
    psyslog.kill()
    done()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

function getConfigPath () {
  const cpath = join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
  return require(cpath)
}

const pinoSyslog = join(__dirname, '..', 'lib', 'transport.js')

test('syslog pino transport test rfc3164', { only: true }, async t => {
  const destination = join(os.tmpdir(), 'pino-transport-test.3164.log')

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
  await once(transport, 'ready')

  log.info(JSON.parse(messages.leadingDay))
  log.debug(JSON.parse(messages.helloWorld)) // it is skipped
  log.info(JSON.parse(messages.trailingDay))

  await timeout(1000)

  const data = fs.readFileSync(destination, 'utf8').trim().split('\n')
  t.assert.ok(data[0].startsWith('<134>Feb  3 01:20:00 MacBook-Pro-3 none[94473]: '), true, 'first line leadingDay')
  t.assert.ok(data[1].startsWith('<134>Feb 10 01:20:00 MacBook-Pro-3 none[94473]: '), true, 'first line trailingDay')
})
