#!/usr/bin/env node
'use strict'

const path = require('node:path')
const fs = require('node:fs')
const realPath = fs.realpathSync(__dirname)
const script = path.join(realPath, 'psyslog.js')

require(script.toString())
