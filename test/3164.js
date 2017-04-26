'use strict'
/* eslint-env node, mocha */

const path = require('path')
const spawn = require('child_process').spawn
const expect = require('chai').expect
const EOL = require('os').EOL

const messages = require(path.join(__dirname, 'fixtures', 'messages'))
const psyslogPath = path.join(path.resolve(__dirname, '..', 'psyslog'))

function configPath () {
  return path.join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
}

suite('3164', function () {
  suite('simple messages', function () {
    test('returns error for overly long rfc3164 messages', function (done) {
      const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: @cee: {"level":30,"time":1459529098958,"msg":"message exceeded syslog 1024 byte limit","originalSize":1110}'
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'cee.json') ])

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
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'messageOnly.json') ])

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
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'appname.json') ])

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
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'facility.json') ])

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
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'tz.json') ])

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
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'cee.json') ])

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
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'ceeMessageOnly.json') ])

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
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'messageOnly.json') ])

      psyslog.stdout.on('data', (data) => {
        const msg = data.toString()
        expect(msg).to.equal(expected)
        psyslog.kill()
        done()
      })

      psyslog.stdin.write(messages.stupidLong + '\n')
    })

    test('appends newline', function (done) {
      const expected = '<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: ' + messages.helloWorld + EOL
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('3164', 'newline.json') ])

      psyslog.stdout.on('data', (data) => {
        const msg = data.toString()
        expect(msg).to.equal(expected)
        psyslog.kill()
        done()
      })

      psyslog.stdin.write(messages.helloWorld + '\n')
    })
  })
})
