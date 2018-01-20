'use strict'

const moment = require('moment-timezone')
const stringify = require('fast-safe-stringify')
const through2 = require('through2')
const utils = require('./utils')

let options

function buildMessage (data) {
  let message = {}
  if (options.messageOnly) {
    message = data.msg
    return message
  }

  if (options.includeProperties.length > 0) {
    options.includeProperties.map((p) => { message[p] = data[p] })
    message = stringify(message)
  } else {
    message = stringify(data)
  }

  return message
}

module.exports = function ($options) {
  options = $options
  const version = 1

  return through2.obj(function transport (data, enc, cb) {
    const severity = utils.levelToSeverity(data.level)
    const pri = (8 * options.facility) + severity
    const tstamp = moment(data.time).tz(options.tz).format().toUpperCase()
    const hostname = data.hostname
    const appname = (options.appname !== 'none') ? options.appname : '-'
    const msgid = (data.req && data.req.id) ? data.req.id : '-'
    const structuredData = (options.structuredData !== 'none') ? options.structuredData : '-'
    const header = `<${pri}>${version} ${tstamp} ${hostname} ${appname} ${data.pid} ${msgid} ${structuredData} `
    const message = buildMessage(data)
    let output = (options.cee && !options.messageOnly) ? `${header}@cee: ${message}` : `${header}${message}`

    output = options.newline ? output + '\n' : output

    setImmediate(() => process.stdout.write(output))
    cb()
  })
}
