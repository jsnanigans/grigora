const fs = require('fs')
const path = require('path')
const stylus = require('stylus')

const sourceFiles = [
  path.join(__dirname, 'grid.styl'),
  path.join(__dirname, 'positioning.styl'),
  path.join(__dirname, 'spacing.styl'),
  path.join(__dirname, '../../styles/variables/layout.styl')
]

const outFile = path.join(__dirname, '_generated.css')

const determinUpdateRequired = _ => {
  if (!fs.existsSync(outFile)) {
    return true
  }

  let latestSourceChange = 0
  sourceFiles.forEach(file => {
    const change = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0

    if (change > latestSourceChange) {
      latestSourceChange = change
    }
  })

  const lastGenerated = fs.statSync(outFile).mtimeMs

  if (lastGenerated < latestSourceChange) {
    return true
  }

  return false
}

const generateFile = _ => {
  const genPath = path.join(__dirname, '_gen')
  const varPath = path.join(__dirname, '../../styles/variables/index')
  stylus(`@import '${varPath}' \n @import '${genPath}'`)
    .use(require('rupture')())
    .use(require('jeet')())
    .render((err, css) => {
      if (err) {
        console.error(err)
        return err
      }

      fs.writeFileSync(outFile, css, err => {
        if (err) {
          console.error(err)
          return err
        }
      })
    })
}

module.exports = {
  generate: _ => {
    const gen = determinUpdateRequired()
    if (gen) {
      generateFile()
    }
    return gen
  }
}
