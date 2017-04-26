'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test
const EOL = require('os').EOL

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
    t.is(code, 0)
  })

  psyslog.stdin.end('this is not json\n')
})

test('returns error for overly long rfc3164 messages', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: @cee: {"level":30,"time":1459529098958,"msg":"message exceeded syslog 1024 byte limit","originalSize":1110}'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'cee.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.is(msg, expected)
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
    t.is(msg, expected)
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
    t.is(msg, expected)
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
    t.is(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})

test('sets timezone', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 12:44:58 MacBook-Pro-3 none[94473]: hello world'
  const psyslog = spawn('node', [psyslogPath, '-c', configPath('3164', 'tz.json')])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.is(msg, expected)
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
    t.is(msg, header + messages.helloWorld)
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
    t.is(msg, expected)
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
    t.is(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.stupidLong + '\n')
})

test('appends newline', (t) => {
  t.plan(1)
  const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: ' + messages.helloWorld + EOL
  const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'newline.json') ])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.is(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})
