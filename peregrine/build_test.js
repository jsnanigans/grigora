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
  fs.readdirSync(directory).forEach(dir => {
    let p = path.join(directory, dir)

    if (fs.lstatSync(p).isDirectory()) {
      if (dir !== 'static') {
        rimraf.sync(p)
      }
    } else {
      fs.unlinkSync(p)
    }
  })
} else {
  fs.mkdirSync(directory)
}

p.loadConfig()
p.generatePages(_ => {})
