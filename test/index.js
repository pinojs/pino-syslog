'use strict'
/* eslint-env node, mocha */

const path = require('path')
const spawn = require('child_process').spawn
const expect = require('chai').expect

const messages = require(path.join(__dirname, 'fixtures', 'messages'))
const psyslogPath = path.join(path.resolve(__dirname, '..', 'psyslog'))

function configPath (name) {
  return path.join(__dirname, 'fixtures', 'configs', name)
}

suite('simple messages', function () {
  test('hello world', function (done) {
    const header = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: '
    const psyslog = spawn('node', [psyslogPath])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(header + messages.helloWorld)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.helloWorld + '\n')
  })

  test('returns error for overly long messages', function (done) {
    const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: {"level":30,"time":1459529098958,"msg":"message exceeded syslog 1024 byte limit","originalSize":1110}'
    const psyslog = spawn('node', [psyslogPath])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(expected)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.stupidLong + '\n')
  })
})

suite('using non-default config', function () {
  test('formats to message only', function (done) {
    const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
    const psyslog = spawn('node', [psyslogPath, '-c', configPath('messageOnly.json')])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(expected)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.helloWorld + '\n')
  })

  test('sets application name', function (done) {
    const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 test[94473]: hello world'
    const psyslog = spawn('node', [psyslogPath, '-c', configPath('appname.json')])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(expected)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.helloWorld + '\n')
  })

  test('sets facility', function (done) {
    const expected = '<6>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
    const psyslog = spawn('node', [psyslogPath, '-c', configPath('facility.json')])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(expected)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.helloWorld + '\n')
  })

  test('sets timezone', function (done) {
    const expected = '<134>Apr  1 12:44:58 MacBook-Pro-3 none[94473]: hello world'
    const psyslog = spawn('node', [psyslogPath, '-c', configPath('tz.json')])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(expected)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.helloWorld + '\n')
  })

  test('prepends `@cee `', function (done) {
    const header = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: @cee: '
    const psyslog = spawn('node', [psyslogPath, '-c', configPath('cee.json')])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(header + messages.helloWorld)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.helloWorld + '\n')
  })

  test('does not prepend `@cee ` for non-json messages', function (done) {
    const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: hello world'
    const psyslog = spawn('node', [psyslogPath, '-c', configPath('ceeMessageOnly.json')])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(expected)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.helloWorld + '\n')
  })

  test('truncates overly long message only log', function (done) {
    const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: ' + JSON.parse(messages.stupidLong).msg.substr(0, 976)
    const psyslog = spawn('node', [psyslogPath, '-c', configPath('messageOnly.json')])

    psyslog.stdout.on('data', (data) => {
      const msg = data.toString()
      expect(msg).to.equal(expected)
      psyslog.kill()
      done()
    })

    psyslog.stdin.write(messages.stupidLong + '\n')
  })
})
