'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const test = require('tap').test

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

test('hello world', (t) => {
  t.plan(1)
  const header = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - '
  const psyslog = spawn('node', [psyslogPath])

  psyslog.stdout.on('data', (data) => {
    const msg = data.toString()
    t.is(msg, header + messages.helloWorld)
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
    t.is(msg, expected)
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
    t.is(msg, expected)
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
    t.is(msg, expected)
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
    t.is(msg, expected)
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
    t.is(msg, header + messages.helloWorld)
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
    t.is(msg, expected)
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
    t.is(msg, expected)
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
    t.is(msg, expected)
    psyslog.kill()
  })

  psyslog.stdin.write(messages.helloWorld + '\n')
})
