var Peregrine = require('./peregrine')
var path = require('path')
var rimraf = require('rimraf')
var fs = require('fs')

var directory = path.join(__dirname, '../dist')

const p = new Peregrine({
  config: path.join(__dirname, '../src/pages.js'),
  env: 'production',
  webpack: false
})

// if (fs.existsSync(directory)) {
//   fs.readdirSync(directory).forEach(dir => {
//     const p = path.join(directory, dir)

//     if (fs.lstatSync(p).isDirectory()) {
//       if (dir !== 'static') {
//         rimraf.sync(p)
//       }
//     } else {
//       fs.unlinkSync(p)
//     }
//   })
// } else {
//   fs.mkdirSync(directory)
// }

p.loadConfig()

console.time('Time')
p.generatePages(/^Home/, pageList => {
  pageList.forEach(page => {
    const html = p.insertAssets(page.content)
    fs.writeFileSync(page.file, html, 'utf8')
  })
  console.log('Pages Generated:', pageList.length)
  console.timeEnd('Time')
})
