'use strict'

const pinoLevels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
}

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

/**
 * pinoLevelToSyslogSeverity is used to maintain a relationship between
 * known or custom pino levels and pino-syslog severity levels.
 *
 */
const pinoLevelToSyslogSeverity = new Map([
  [pinoLevels.trace, severity.debug],
  [pinoLevels.debug, severity.debug],
  [pinoLevels.info, severity.info],
  [pinoLevels.warn, severity.warning],
  [pinoLevels.error, severity.error],
  [pinoLevels.fatal, severity.critical]
])

const defaults = {
  enablePipelining: true,
  modern: true,
  appname: 'none',
  cee: false,
  facility: 16,
  includeProperties: [],
  messageOnly: false,
  tz: 'UTC',
  newline: false,
  sync: false,
  pinoLevelToSyslogSeverity
}

/**
 * When the options object contains the `customLEvels` property, the custom level is added to the pinoLevelToSyslogSeverity
 * map along with its transformation into one of the syslog levels.
 *
 * When the given severity level does not exist, the default severity.error is used.
 * @param {*} options
 * @param {*} args
 * @returns
 */
function buildOptions (options = {}, args = {}) {
  const opts = Object.assign({}, defaults, options, args)

  if (options.customLevels == null) {
    return opts
  }

  for (const [key, { level, syslogSeverity }] of Object.entries(options.customLevels)) {
    const sev = severity[syslogSeverity] || severity.error

    pinoLevels[key] = level
    pinoLevelToSyslogSeverity.set(pinoLevels[key], sev)
  }

  opts.pinoLevelToSyslogSeverity = pinoLevelToSyslogSeverity
  return opts
}

module.exports = {
  severity,
  buildOptions,
  defaults
}
