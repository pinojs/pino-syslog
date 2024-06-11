'use strict'

const build = require('pino-abstract-transport')
const SonicBoom = require('sonic-boom')
const { Transform, pipeline } = require('stream')
const { defaults } = require('./utils')
const { messageBuilderFactory: rfc5424 } = require('./rfc5424.js')
const { messageBuilderFactory: rfc3164 } = require('./rfc3164.js')

module.exports = pinoTransport

function pinoTransport (options) {
  const opts = Object.assign({}, defaults, options)

  const processMessage = opts.modern ? rfc5424(opts) : rfc3164(opts)

  let destination
  if (opts.enablePipelining !== true) {
    destination = getStream(opts.destination, opts.sync)
  }

  return build(function (source) {
    const stream = new Transform({
      objectMode: true,
      autoDestroy: true,
      transform (obj, enc, cb) {
        const msg = processMessage(obj)
        cb(null, msg)
      }
    })

    const pipeflow = [
      source,
      stream
    ]
    if (destination) {
      pipeflow.push(destination)
    }
    pipeline(pipeflow, () => {
      // process._rawDebug('pino-transport: finished piping')
    })

    return stream
  }, {
    enablePipelining: opts.enablePipelining
  })
}

function getStream (fileDescriptor, sync) {
  return new SonicBoom({ dest: parseInt(fileDescriptor), sync })
}
