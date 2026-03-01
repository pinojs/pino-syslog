'use strict'

const { DateTime } = require('luxon')
const stringify = require('fast-safe-stringify')
const through2 = require('through2')

function messageBuilderFactory (options) {
  const levelToSeverity = options.pinoLevelToSyslogSeverity
  return function (data) {
    const severity = levelToSeverity.get(data.level)
    const pri = (8 * options.facility) + severity
    let timestamp = DateTime.fromMillis(data.time, { zone: options.tz }).toFormat('LLL dd HH:mm:ss')
    if (timestamp[4] === '0') {
      timestamp = timestamp.substr(0, 4) + ' ' + timestamp.substr(5)
    }
    const hostname = data.hostname.split('.')[0]
    const header = `<${pri}>${timestamp} ${hostname} ${options.appname}[${data.pid}]: `
    if (options.levelAsText) {
      data.level = options.pinoLabels.get(data.level)
    }
    if (options.filterProperties.length > 0) {
      for (const key of options.filterProperties) {
        delete data[key]
      }
    }
    const message = buildMessage(data, header.length)
    return (options.cee && !options.messageOnly)
      ? `${header}@cee: ${message}${options.newline ? '\n' : ''}`
      : `${header}${message}${options.newline ? '\n' : ''}`
  }

  function buildMessage (data, headerBytes) {
    const hlen = (options.cee) ? headerBytes - 6 : headerBytes
    let message = {}
    if (options.messageOnly) {
      message = data.msg.substr(0, 1024 - headerBytes)
      return message
    }

    if (options.includeProperties.length > 0) {
      options.includeProperties.forEach((p) => { message[p] = data[p] })
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
}

module.exports = function (options) {
  const processMessage = messageBuilderFactory(options)
  return through2.obj(function transport (data, enc, cb) {
    const output = processMessage(data)
    setImmediate(() => process.stdout.write(output))
    cb()
  })
}
module.exports.messageBuilderFactory = messageBuilderFactory
