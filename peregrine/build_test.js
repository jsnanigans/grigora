var Peregrine = require('./peregrine')
var path = require('path')

let p = new Peregrine({
  config: path.join(__dirname, '../src/pages.js'),
  env: 'production'
})

p.loadConfig()
p.generatePages()
// peregrine.generatePages()
