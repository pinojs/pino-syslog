'use strict'
/* eslint-env node, mocha */

const path = require('path')
const spawn = require('child_process').spawn
const expect = require('chai').expect

const messages = require(path.join(__dirname, 'fixtures', 'messages'))
const psyslogPath = path.join(path.resolve(__dirname, '..', 'psyslog'))

function configPath () {
  return path.join.apply(null, [__dirname, 'fixtures', 'configs'].concat(Array.from(arguments)))
}

suite('5424', function () {
  suite('simple messages', function () {
    test('hello world', function (done) {
      const header = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - BOM'
      const psyslog = spawn('node', [ psyslogPath ])

      psyslog.stdout.on('data', (data) => {
        const msg = data.toString()
        expect(msg).to.equal(header + messages.helloWorld)
        psyslog.kill()
        done()
      })

      psyslog.stdin.write(messages.helloWorld + '\n')
    })
  })

  suite('using non-default config', function () {
    test('formats to message only', function (done) {
      const expected = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - BOMhello world'
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('5424', 'messageOnly.json') ])

      psyslog.stdout.on('data', (data) => {
        const msg = data.toString()
        expect(msg).to.equal(expected)
        psyslog.kill()
        done()
      })

      psyslog.stdin.write(messages.helloWorld + '\n')
    })

    test('sets application name', function (done) {
      const expected = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 test 94473 - - BOMhello world'
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('5424', 'appname.json') ])

      psyslog.stdout.on('data', (data) => {
        const msg = data.toString()
        expect(msg).to.equal(expected)
        psyslog.kill()
        done()
      })

      psyslog.stdin.write(messages.helloWorld + '\n')
    })

    test('sets facility', function (done) {
      const expected = '<6>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - BOMhello world'
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('5424', 'facility.json') ])

      psyslog.stdout.on('data', (data) => {
        const msg = data.toString()
        expect(msg).to.equal(expected)
        psyslog.kill()
        done()
      })

      psyslog.stdin.write(messages.helloWorld + '\n')
    })

    test('sets timezone', function (done) {
      const expected = '<134>1 2016-04-01T12:44:58-04:00 MacBook-Pro-3 - 94473 - - BOMhello world'
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('5424', 'tz.json') ])

      psyslog.stdout.on('data', (data) => {
        const msg = data.toString()
        expect(msg).to.equal(expected)
        psyslog.kill()
        done()
      })

      psyslog.stdin.write(messages.helloWorld + '\n')
    })

    test('prepends `@cee `', function (done) {
      const header = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - BOM@cee: '
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('5424', 'cee.json') ])

      psyslog.stdout.on('data', (data) => {
        const msg = data.toString()
        console.log(msg)
        expect(msg).to.equal(header + messages.helloWorld)
        psyslog.kill()
        done()
      })

      psyslog.stdin.write(messages.helloWorld + '\n')
    })

    test('does not prepend `@cee ` for non-json messages', function (done) {
      const expected = '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - BOMhello world'
      const psyslog = spawn('node', [ psyslogPath, '-c', configPath('5424', 'ceeMessageOnly.json') ])

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
