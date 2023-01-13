'use strict'

const { join } = require('path')
const { spawnSync } = require('child_process')
const { test } = require('tap')

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
