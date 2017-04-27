'use strict'

const moment = require('moment-timezone')
const stringify = require('fast-safe-stringify')
const through2 = require('through2')
const utils = require('./utils')

let options

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

module.exports = function ($options) {
  options = $options
  const zeroReg = /0/

  return through2.obj(function transport (data, enc, cb) {
    const severity = utils.levelToSeverity(data.level)
    const pri = (8 * options.facility) + severity
    const tstamp = moment(data.time).tz(options.tz).format('MMM DD HH:mm:ss').replace(zeroReg, ' ')
    const hostname = data.hostname.split('.')[ 0 ]
    const header = `<${pri}>${tstamp} ${hostname} ${options.appname}[${data.pid}]: `
    const message = buildMessage(data, header.length)
    let output = (options.cee && !options.messageOnly) ? `${header}@cee: ${message}` : `${header}${message}`

    output = options.newline ? output + '\n' : output

    setImmediate(() => process.stdout.write(output))
    cb()
  })
}
