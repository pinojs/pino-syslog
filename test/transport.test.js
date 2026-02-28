'use strict'

const test = require('node:test')
const { join } = require('node:path')
const { spawnSync } = require('node:child_process')

test('syslog pino transport test stdout', async t => {
  const result = spawnSync('node', ['--no-warnings', join(__dirname, 'fixtures', 'log-stdout.js'), '1'], {
    cwd: process.cwd()
  })
  t.assert.equal(result.stdout.toString().trim(), '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - hello world')
  t.assert.equal(result.status, 0)
})

test('syslog pino transport test stderr', async t => {
  const result = spawnSync('node', ['--no-warnings', join(__dirname, 'fixtures', 'log-stdout.js'), '2'], {
    cwd: process.cwd()
  })
  t.assert.equal(result.stderr.toString().trim(), '<134>1 2016-04-01T16:44:58Z MacBook-Pro-3 - 94473 - - hello world')
  t.assert.equal(result.status, 0)
})
