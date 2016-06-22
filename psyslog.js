'use strict'

const moment = require('moment-timezone')
const nopt = require('nopt')
const path = require('path')
const pump = require('pump')
const split2 = require('split2')
const stringify = require('fast-safe-stringify')
const through2 = require('through2')

const longOpts = {
  config: String
}

const shortOpts = {
  c: '--config'
}

const args = nopt(longOpts, shortOpts)

let userOptions = {}
if (args.config) {
  try {
    userOptions = require(path.resolve(args.config))
  } catch (e) {
    process.stderr.write(`could not load settings file, using defaults: ${e.message}`)
  }
}

const defaults = {
  appname: 'none',
  cee: false,
  facility: 16,
  includeProperties: [],
  messageOnly: false,
  tz: 'Etc/UTC'
}

const options = Object.assign(defaults, userOptions)

const severity = {
  emergency: 0,
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
}

function levelToSeverity (level) {
  let result
  switch (level) {
    case 10: // pino: trace
      result = severity.debug
      break
    case 20: // pino: debug
      result = severity.debug
      break
    case 30: // pino: info
      result = severity.info
      break
    case 40: // pino: warn
      result = severity.warning
      break
    case 50: // pino: error
      result = severity.error
      break
    default:
    case 60: // pino: fatal
      result = severity.critical
      break
  }
  return result
}

function buildMessage (data, headerBytes) {
  const hlen = (options.cee) ? headerBytes - 6 : headerBytes
  let message = {}
  if (options.messageOnly) {
    message = data.msg.substr(0, 1024 - headerBytes)
    return message
  }

  if (options.includeProperties.length > 0) {
    options.includeProperties.map((p) => { message[p] = data[p] })
    message = stringify(message)
  } else {
    message = stringify(data)
  }

  if (message.length > (1024 - hlen)) {
    message = stringify({
      level: data.level,
      time: data.time,
      msg: 'message exceeded syslog 1024 byte limit',
      originalSize: message.length
    })
  }

  return message
}

const zeroReg = /0/
const myTransport = through2.obj(function transport (data, enc, cb) {
  const severity = levelToSeverity(data.level)
  const pri = (8 * options.facility) + severity
  const tstamp = moment(data.time).tz(options.tz).format('MMM DD HH:mm:ss').replace(zeroReg, ' ')
  const hostname = data.hostname.split('.')[0]
  const header = `<${pri}>${tstamp} ${hostname} ${options.appname}[${data.pid}]: `
  const message = buildMessage(data, header.length)
  const output = (options.cee && !options.messageOnly) ? `${header}@cee: ${message}` : `${header}${message}`

  setImmediate(() => process.stdout.write(output))
  cb()
})

pump(process.stdin, split2(JSON.parse), myTransport)
