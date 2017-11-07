var Peregrine = require('./peregrine')
var path = require('path')
var rimraf = require('rimraf')
var fs = require('fs')

var directory = path.join(__dirname, '../dist')

let p = new Peregrine({
  config: path.join(__dirname, '../src/pages.js'),
  env: 'production',
  webpack: false
})

if (fs.existsSync(directory)) {
  rimraf.sync(directory)
  fs.mkdirSync(directory)
} else {
  fs.mkdirSync(directory)
}

p.loadConfig()
p.generatePages(_ => {})
// peregrine.generatePages()
