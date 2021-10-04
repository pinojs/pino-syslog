'use strict'

const pino = require('pino')
const { join } = require('path')

const options = {
  destination: parseInt(process.argv[2]),
  enablePipelining: false,
  cee: true,
  messageOnly: true
}

const transport = pino.transport({
  target: join(__dirname, '../../lib/transport.js'),
  level: 'info',
  options
})

const log = pino(transport)
const logString = require('./messages').helloWorld
log.info(JSON.parse(logString))
