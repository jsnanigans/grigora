const fs = require('fs')
const path = require('path')
// const ejs = require('ejs')
// const handlebars = require('handlebars')
const ECT = require('ect')
const componentsPath = './src/05_components/'
var assets = []

let cacheAge = 1.2e+6 // 20 minutes
// let cacheAge = 1000 // 20 minutes

const componentCache = {}
const componentAssets = {}
const fileCache = {}

let log = {
  log: '',
  clear: _ => {
    this.log = ''
  },
  add: t => {
    if (typeof this.log !== 'string') {
      this.log = ''
    }
    this.log += t + '\n'
  },
  print: _ => {
    setTimeout(_ => {
      console.log('=======')
      console.log(this.log)
      console.log('=======')
    })
  }
}

// function requireUncached (module) {
//   delete require.cache[module]
//   return require(module)
// }

function dropCache (name) {
  // crear file from componentCache
  Object.keys(componentCache).forEach(key => {
    if (key.indexOf(name) !== -1) {
      delete componentCache[key]
    }
  })

  // clear file cache
  if (fileCache[name]) {
    delete fileCache[name]
  }

  // clear componentCache if include is updates
  Object.keys(componentAssets).forEach(key => {
    if (name === key) {
      componentAssets[key].forEach(compKey => {
        if (componentCache[compKey]) {
          delete componentCache[compKey]
        }
      })
    }
  })
}

function grigora (options) {
  // this.options = options
  this.configFile = options.config || false
  this.config = {}
  this.relatedFiles = []

  let incTemplateRegex = /\{\{+(add) '+(.*)'\}\}/g

  this.parseAssetPath = assetPath => {
    let basePath = path.join(__dirname, 'src')
    let rt = false

    if (assetPath.indexOf('layouts') === 0) {
      rt = basePath + '/04_' + assetPath
    }
    if (assetPath.indexOf('parts') === 0) {
      rt = basePath + '/03_' + assetPath
    }

    if (rt) {
      this.relatedFiles.push(rt)
      this.watchFiles()
    }
    return rt
  }

  // resolve custom includes and replace with the tempalte
  this.includeTemplates = (template, cacheName) => {
    let match
    do {
      match = incTemplateRegex.exec(template)
      if (match) {
        let snippet = match[0]
        let assetPath = match[2]
        if (assetPath.indexOf('.html') === -1) {
          assetPath += '/default.html'
        }

        let resolvedPath = this.parseAssetPath(assetPath)

        if (typeof componentAssets[resolvedPath] === 'undefined') {
          componentAssets[resolvedPath] = []
        }
        if (componentAssets[resolvedPath].indexOf(cacheName) === -1) {
          componentAssets[resolvedPath].push(cacheName)
        }

        try {
          let fileContent = fs.readFileSync(resolvedPath, 'utf8')
          template = template.replace(snippet, fileContent)
        } catch (e) {
          console.log('NOT FOUND: ' + assetPath)
        }
      }
    } while (match)

    return template
  }

  this.includeTemplatesRecursive = (template, cacheName) => {
    let tmp = template

    tmp = this.includeTemplates(tmp, cacheName)
    tmp = this.includeTemplates(tmp, cacheName)

    return tmp
  }

  this.readModuleTemplate = (templatePath, callback) => {
    try {
      var filename = require.resolve(templatePath)

      if (fileCache[filename]) {
        callback(fileCache[filename])
      } else {
        let fileContent = fs.readFileSync(filename, 'utf8')
        fileCache[filename] = fileContent
        callback(fileContent)
      }
    } catch (e) {
      // callback(e)
      console.log('readModuleTemplate failed')
    }
  }

  this.loadConfig = _ => {
    if (this.configFile) {
      this.config = require(this.configFile)
    }
  }

  this.startTime = Date.now()
  this.prevTimestamps = {}

  let insertAssets = html => {
    if (html.indexOf('{{insert_assets}}') !== -1) {
      let assetSources = ''
      assets.forEach(asset => {
        assetSources += '<script type="text/javascript" src="' + asset + '"></script>'
      })

      html = html.replace('{{insert_assets}}', assetSources)
    }

    return html
  }

  this.cleanOldComponentCache = _ => {
    let now = Date.now()
    Object.keys(componentCache).forEach(key => {
      let date = componentCache[key][0]
      if (now - cacheAge < date) {
        // delete componentCache[key]
      }
    })
  }

  let renderTemplate = (body, seed, cacheName) => {
    let cached = componentCache[cacheName] || [false, false]
    // let cached = [false, false]
    let now = Date.now()

    if (cached[0] !== false &&
      now - cacheAge < cached[0]) {
      cached[0] = now
      log.add('cache used')

      return cached[1]
    }

    let rendered = ''

    body = this.includeTemplatesRecursive(body, cacheName)
    try {
      // rendered = ejs.render(body, seed)
      // let tmpl = handlebars.compile(body)
      // rendered = tmpl(seed)

      if (body) {
        let renderer = ECT({
          root: {
            layout: '<% content %>',
            page: body
          }
        })
        rendered = renderer.render('page', seed)
        log.add('cache created')
        componentCache[cacheName] = [now, rendered]
      } else {
        console.log('body is ', body)
      }
    } catch (e) {
      console.log(e)
    }

    return rendered
  }

  this.renderSingleComponent = (comp, rtfn) => {
    let modID = comp.srcFile.split('/')
    modID = modID[modID.length - 3] + ' - ' + modID[modID.length - 1]
    let modStart = Date.now()
    log.add('start module ' + modID)
    this.readModuleTemplate(comp.srcFile, body => {
      let cacheName = comp.srcFile + '++' + comp.seedFile
      let rendered = renderTemplate(body, comp.seedData, cacheName)
      log.add('fin module ' + modID + ' - ' + (Date.now() - modStart + 'ms'))
      rendered = insertAssets(rendered)

      if (rtfn) {
        rtfn(rendered)
      } else {
        return rendered
      }
    })
  }

  this.renderComponents = (componentsObjects, modulesDone) => {
    let combinedHTML = []
    let comps = componentsObjects
    let sync = false

    let compsDone = 0
    let compsTotal = comps.length

    if (compsTotal) {
      if (!sync) {
        // sync components
        let compCallback = rendered => {
          log.add('start')
          combinedHTML[compsDone] = rendered
          compsDone++

          if (compsDone === compsTotal) {
            modulesDone(combinedHTML.join(''))
          } else {
            this.renderSingleComponent(comps[compsDone], compCallback)
          }
        }
        this.renderSingleComponent(comps[compsDone], compCallback)
      } else {
        // async compile
        comps.forEach((comp, index) => {
          log.add('start')
          this.renderSingleComponent(comp, rendered => {
            combinedHTML[index] = rendered
            compsDone++
            if (compsDone === compsTotal) {
              modulesDone(combinedHTML.join(''))
            }
          })
        })
      }
    } else {
      modulesDone(combinedHTML.join(''))
    }
  }

  this.generatePage = (pageOpts, options, pageDone) => {
    const name = pageOpts.name

    log.add('start page: ' + name)
    let pageStart = Date.now()

    let prepend = options.beforeEach.components || []
    let append = options.afterEach.components || []

    let components = prepend.concat(pageOpts.components).concat(append)

    let componentsObjects = components.map(comp => {
      let base = path.join(__dirname, componentsPath) + comp

      let rt = {
        name: comp,
        srcFile: base + '/templates/default.html',
        seedFile: base + '/seeds/default.js'
      }

      let configPath = base + '/config.grigora.js'
      if (fs.existsSync(configPath)) {
        if (this.relatedFiles.indexOf(configPath) === -1 && configPath !== '' && configPath) {
          this.relatedFiles.push(configPath)
        }
        let conf = {}
        try {
          conf = require(configPath)
        } catch (e) {
          console.log('error reading: ' + configPath)
        }

        if (conf.template) {
          if (conf.template.default) {
            rt.srcFile = base + '/' + conf.template.default
          } else {
            rt.srcFile = base + '/templates/' + conf.template
          }
        }
        if (conf.seed) {
          if (conf.seed.default) {
            rt.seedFile = base + '/' + conf.seed.default
          } else {
            rt.seedFile = base + '/seeds/' + conf.seed
          }
        }
      }

      rt.seedData = fs.existsSync(rt.seedFile) ? require(rt.seedFile) : false
      if (this.relatedFiles.indexOf(rt.srcFile) === -1 && rt.srcFile !== '' && rt.srcFile) {
        this.relatedFiles.push(rt.srcFile)
      }
      if (fs.existsSync(rt.seedFile) && this.relatedFiles.indexOf(rt.seedFile) === -1 && rt.seedFile !== '' && rt.seedFile) {
        this.relatedFiles.push(rt.seedFile)
      }

      return rt
    })

    this.renderComponents(componentsObjects, (allHTML) => {
      fs.writeFile(path.join(__dirname, './dist/') + name + '.' + (options.fileEnding || '.html'), allHTML, 'utf8', _ => {})
      log.add('page done ' + name + ' - ' + (Date.now() - pageStart) + 'ms')
      pageDone()
    })
  }

  this.watchFiles = _ => {
    this.relatedFiles.forEach(file => {
      this.compilation.fileDependencies.push(file)
    })
  }

  this.generatePages = done => {
    // gernerate pages

    const conf = this.config
    const options = conf.options || {}
    const pages = conf.pages || []

    let pagesDone = 0
    pages.forEach(page => {
      this.generatePage(page, options, _ => {
        pagesDone++
        if (pagesDone === pages.length) {
          log.print()
          done()
        }
      })
    })
  }

  this.initial = true
}

grigora.prototype.apply = function (compiler) {
  this.distPath = compiler.options.output.path
  compiler.plugin('emit', function (compilation, callback) {
    // console.log(compilation.assets)
    assets = []
    Object.keys(compilation.assets).forEach(key => {
      assets.push('/' + key)
    })

    let directory = path.join(__dirname, './dist')
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory)
    }

    fs.readdir(directory, (err, files) => {
      log.clear()
      if (err) throw err

      for (const file of files) {
        fs.unlinkSync(path.join(directory, file), err => {
          console.error('error unlinking - ' + path.join(directory, file) + ' - ' + err)
        })
      }

      var changedFiles = Object.keys(compilation.fileTimestamps).filter(function (watchfile) {
        return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity)
      }.bind(this))

      changedFiles.forEach(file => {
        delete require.cache[file]
        dropCache(file)
        if (file === this.configFile) {
          this.loadConfig()
        }
        if (file === this.configFile || this.relatedFiles.indexOf(file) !== -1) {
          this.generatePages(_ => {
            if (compilation.hotMiddleware) {
              setTimeout(_ => {
                compilation.hotMiddleware.publish({
                  action: 'reload'
                })
                this.cleanOldComponentCache()
              })
            }
          })
        }
      })

      this.prevTimestamps = compilation.fileTimestamps
      this.compilation = compilation
      if (this.initial) {
        this.initial = false

        this.loadConfig()
        this.generatePages(_ => {})
      }

      this.compilation.fileDependencies.push(path.join(__dirname, './src/routes.js'))
      this.watchFiles()
      callback()
    })
  }.bind(this))
}

module.exports = grigora
