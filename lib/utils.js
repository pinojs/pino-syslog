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

const pinoLevelToSyslogSeverity = new Map([
  [pinoLevels.trace, severity.debug],
  [pinoLevels.debug, severity.debug],
  [pinoLevels.info, severity.info],
  [pinoLevels.warn, severity.warning],
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

function buildOptions (options = {}, args = {}) {
  const opts = Object.assign({}, defaults, options, args)

  if (options.customLevel == null) {
    return opts
  }

  for (const [key, { level, syslogSeverity }] of Object.entries(options.customLevel)) {
    pinoLevels[key] = level
    pinoLevelToSyslogSeverity.set(pinoLevels[key], severity[syslogSeverity])
  }

  opts.pinoLevelToSyslogSeverity = pinoLevelToSyslogSeverity
  return opts
}

module.exports = {
  severity,
  buildOptions,
  defaults
}
