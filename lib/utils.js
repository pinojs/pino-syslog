'use strict'

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
    case 60: // pino: fatal
    default:
      result = severity.critical
      break
  }
  return result
}

const defaults = {
  modern: true,
  appname: 'none',
  cee: false,
  facility: 16,
  includeProperties: [],
  messageOnly: false,
  tz: 'Etc/UTC',
  newline: false
}

module.exports = {
  severity,
  levelToSeverity,
  defaults
}
