'use strict'

const build = require('pino-abstract-transport')
const SonicBoom = require('sonic-boom')
const { defaults } = require('./utils')
const { messageBuilderFactory: rfc5424 } = require('./rfc5424.js')
const { messageBuilderFactory: rfc3164 } = require('./rfc3164.js')

module.exports = pinoTransport

function pinoTransport (options) {
  const opts = Object.assign({}, defaults, options)

  const processMessage = opts.modern ? rfc5424(opts) : rfc3164(opts)

  const destination = getStream(opts.destination)

  return build(function (source) {
    source.on('data', function (obj) {
      const canContinue = destination.write(processMessage(obj))
      if (!canContinue) {
        source.pause()
        destination.once('drain', () => { source.resume() })
      }
    })
  }, {
    close (err, cb) {
      if (destination.writableEnded) {
        process.nextTick(cb, err)
      } else {
        destination.end(cb.bind(null, err))
      }
    }
  })
}

function getStream (fileDescriptor) {
  if (fileDescriptor === 1 || !fileDescriptor) return process.stdout
  else if (fileDescriptor === 2) return process.stderr
  else if (fileDescriptor !== undefined) return SonicBoom({ dest: parseInt(fileDescriptor), sync: false })
}
