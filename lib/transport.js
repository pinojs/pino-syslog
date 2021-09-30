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
    destination = getStream(opts.destination)
  }

  return build(function (source) {
    // source.on('data', function (obj) {
    //   const canContinue = destination.write(processMessage(obj))
    //   if (!canContinue) {
    //     source.pause()
    //     destination.once('drain', () => { source.resume() })
    //   }
    // })

    const stream = new Transform({
      objectMode: true,
      autoDestroy: true,
      transform (obj, enc, cb) {
        cb(null, processMessage(obj))
      }
    })

    if (destination) {
      pipeline(source, stream, destination, () => {
        // process._rawDebug('pino-transport: finished piping')
      })
    }

    return stream
  }, {
    close (err, cb) {
      if (!destination || destination.writableEnded) {
        process.nextTick(cb, err)
      } else if (destination instanceof SonicBoom) {
        destination.end()
        process.nextTick(cb, err)
      } else {
        destination.end(cb.bind(null, err))
      }
    }
  }, {
    enablePipelining: opts.enablePipelining
  })
}

function getStream (fileDescriptor) {
  if (fileDescriptor === 1 || !fileDescriptor) return process.stdout
  else if (fileDescriptor === 2) return process.stderr
  else if (fileDescriptor !== undefined) return SonicBoom({ dest: parseInt(fileDescriptor), sync: false })
}
