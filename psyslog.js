'use strict'

const nopt = require('nopt')
const path = require('path')
const pump = require('pump')
const split2 = require('split2')
const parseJson = require('fast-json-parse')

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

const longOpts = {
  modern: Boolean,
  appname: String,
  cee: Boolean,
  facility: Number,
  includeProperties: String,
  messageOnly: Boolean,
  tz: String,
  newline: Boolean,
  structuredData: String,
  config: String
}

const shortOpts = {
  m: '--modern',
  a: '--appname',
  f: '--facility',
  p: '--includeProperties',
  mo: '--messageOnly',
  n: '--newline',
  s: '--structuredData',
  c: '--config'
}

const args = nopt(longOpts, shortOpts)
let options = Object.assign({}, defaults, args)

let userOptions = {}
if (args.config) {
  try {
    userOptions = require(path.resolve(args.config))
  } catch (e) {
    process.stderr.write(`could not load settings file, using defaults: ${e.message}`)
  }
  options = Object.assign({}, options, userOptions)
}

let myTransport
if (options.modern) {
  myTransport = require('./lib/rfc5424.js')(options)
} else {
  myTransport = require('./lib/rfc3164.js')(options)
}

function parser (str) {
  const result = parseJson(str)
  if (result.err) return
  return result.value
}

pump(process.stdin, split2(parser), myTransport)
process.on('SIGINT', () => { process.exit(0) })
