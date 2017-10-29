const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
// const shell = require('shelljs')
const rimraf = require('rimraf')
const encrypt = require('crypto-js/md5')
const tidy = require('htmltidy').tidy

let logEnabled = false
let showErrors = false

if (process.env.NODE_ENV === 'development') {
  showErrors = true
}

const componentsPath = './src/05_components/'
let fileExtension = '.ejs'
let globalSeed = {}

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
      if (logEnabled) {
        console.log('=======')
        console.log(this.log)
        console.log('=======')
      }
    }, 200)
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

function peregrine (options) {
  // this.options = options
  this.configFile = options.config || false
  this.config = {}
  this.relatedFiles = []

  let layoutTemplateRegex = /\{\{+(layout) '+(.*)'\}\}/g
  let partTemplateRegex = /\{\{+(part) '+(.*)'\}\}/g

  this.parseAssetPath = assetPath => {
    let basePath = path.join(__dirname, 'src')
    let rt = false

    if (assetPath.indexOf('layout') === 0) {
      rt = basePath + '/04_layouts'
    }
    if (assetPath.indexOf('part') === 0) {
      rt = basePath + '/03_parts'
    }

    if (rt) {
      this.relatedFiles.push(rt)
      this.watchFiles()
    }
    return rt
  }

  // resolve custom includes and replace with the tempalte
  this.includeLayouts = (template, cacheName) => {
    let match
    do {
      match = layoutTemplateRegex.exec(template)
      if (match) {
        let snippet = match[0]
        let assetPath = match[1]
        let layoutName = match[2]

        if (layoutName.indexOf(fileExtension) === -1) {
          assetPath += '/default' + fileExtension
        }

        let resolvedPath = this.parseAssetPath(assetPath) + '/' + layoutName

        if (layoutName.indexOf('/') === -1) {
          resolvedPath += '/default' + fileExtension
        } else {
          resolvedPath += fileExtension
        }

        if (typeof componentAssets[resolvedPath] === 'undefined') {
          componentAssets[resolvedPath] = []
        }
        if (componentAssets[resolvedPath].indexOf(cacheName) === -1) {
          componentAssets[resolvedPath].push(cacheName)
        }

        try {
          let fileContent = fs.readFileSync(resolvedPath, 'utf8')
          template = template.replace(snippet, fileContent)

          if (this.relatedFiles.indexOf(resolvedPath) === -1) {
            this.relatedFiles.push(resolvedPath)
          }
        } catch (e) {
          console.log('NOT FOUND: ' + assetPath, resolvedPath)
        }
      }
    } while (match)

    return template
  }
  this.includeParts = (template, cacheName) => {
    let match
    do {
      match = partTemplateRegex.exec(template)
      if (match) {
        let snippet = match[0]
        let assetPath = match[1]
        let layoutName = match[2]

        if (layoutName.indexOf(fileExtension) === -1) {
          assetPath += '/default' + fileExtension
        }

        let resolvedPath = this.parseAssetPath(assetPath) + '/' + layoutName

        if (layoutName.indexOf('/') === -1) {
          resolvedPath += '/default' + fileExtension
        } else {
          resolvedPath += fileExtension
        }

        if (typeof componentAssets[resolvedPath] === 'undefined') {
          componentAssets[resolvedPath] = []
        }
        if (componentAssets[resolvedPath].indexOf(cacheName) === -1) {
          componentAssets[resolvedPath].push(cacheName)
        }

        try {
          let fileContent = fs.readFileSync(resolvedPath, 'utf8')
          template = template.replace(snippet, fileContent)

          if (this.relatedFiles.indexOf(resolvedPath) === -1) {
            this.relatedFiles.push(resolvedPath)
          }
        } catch (e) {
          console.log('NOT FOUND: ' + assetPath, resolvedPath)
        }
      }
    } while (match)

    return template
  }

  this.includeTemplatesRecursive = (template, cacheName) => {
    let tmp = template

    tmp = this.includeLayouts(tmp, cacheName)
    tmp = this.includeParts(tmp, cacheName)
    // tmp = this.includeTemplates(tmp, cacheName)

    return tmp
  }

  this.readModuleTemplate = (templatePath, callback) => {
    let errorText = `
    <div style="margin:10px;padding:10px;background:#fff;color:#e00;font-size:16px;border:2px solid black;">
      Component Template: <br />
      <b>"${templatePath}"</b><br />
      could not be found.
    </div>`

    if (fs.existsSync(templatePath)) {
      var filename = require.resolve(templatePath)
    } else {
      if (showErrors) {
        callback(errorText)
      } else {
        callback()
      }
      return
    }
    try {
      if (fileCache[filename]) {
        callback(fileCache[filename])
      } else {
        try {
          let fileContent = fs.readFileSync(filename, 'utf8')
          fileCache[filename] = fileContent
          callback(fileContent)
        } catch (e) {
          callback(errorText)
        }
      }
    } catch (e) {
      // callback(e)
      console.log('readModuleTemplate failed')
    }
  }

  this.loadConfig = _ => {
    if (this.configFile) {
      this.config = require(this.configFile)
      if (this.config.globalSeed) {
        globalSeed = this.config.globalSeed

        let genNavs = {}
        this.config.pages.map(page => {
          if (page.navigation) {
            if (!genNavs[page.navigation]) {
              genNavs[page.navigation] = []
            }

            genNavs[page.navigation].push({
              name: page.name,
              slug: page.index ? '/' : '/' + page.route
            })
          }
        })

        globalSeed.generatedNavigation = genNavs
      }
    }
  }

  this.startTime = Date.now()
  this.prevTimestamps = {}

  let insertAssets = html => {
    if (html.indexOf('{{insert_scripts}}') !== -1) {
      let assetSources = []

      Object.keys(this.compilation.assets).forEach(file => {
        let asset = this.compilation.assets[file]

        if (file.endsWith('.js')) {
          if (file.indexOf('crit.') === -1) {
            assetSources.push('<script type="text/javascript" src="' + file + '"></script>')
          } else {
            let fileContent = asset._value
            assetSources.push('<script type="text/javascript">' + fileContent + '</script>')
          }
        }
      })

      assetSources.reverse()

      html = html.replace('{{insert_scripts}}', assetSources.join(''))
    }

    if (html.indexOf('{{insert_styles}}') !== -1) {
      let assetSources = []
      Object.keys(this.compilation.assets).forEach(file => {
        let asset = this.compilation.assets[file]

        if (file.endsWith('.css')) {
          if (file.indexOf('crit.') === -1) {
            assetSources.push(`
            <script type="text/javascript">
              let f = document.createElement('link');
              f.rel = 'stylesheet';
              f.href = '/${file}';
              f.type = 'text/css';
              document.getElementsByTagName('head')[0].appendChild(f);
            </script>
            `)
          } else {
            let fileContent = asset._value
            assetSources.push('<style>' + fileContent + '</style>')
          }
        }
      })

      assetSources.reverse()

      html = html.replace('{{insert_styles}}', assetSources.join(''))
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
      if (body) {
        seed = Object.assign({}, globalSeed, seed)
        rendered = ejs.render(body, seed)

        log.add('cache created')
        componentCache[cacheName] = [now, rendered]
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
      if (!body) {
        body = ''
      }

      let cacheName = comp.srcFile + '++' + comp.seedFile
      let seed = Object.assign({}, comp.seedData, comp.addComponentSeed)
      let seedString = JSON.stringify(seed)
      let hash = encrypt(seedString, 'secret').words.join('')

      let rendered = renderTemplate(body, seed, cacheName + '--' + hash)

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
    let sync = true

    let compsDone = 0
    let compsTotal = comps.length

    if (compsTotal) {
      if (!sync) {
        // sync components
        let compCallback = rendered => {
          // Comment before
          // let commentBefore = '\n<!-- Component START: ' + JSON.stringify(comp) + ' -->\n'
          // let commentAfter = '\n<!-- Component END: ' + JSON.stringify(comp) + ' -->\n'

          // combinedHTML[compsDone] = commentBefore + rendered + commentAfter
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
          this.renderSingleComponent(comp, rendered => {
            let compHTML = ''
            // Comment before
            compHTML = '<!-- Component START: "' + comp.name + '"' +
              ' Template: ' + comp.srcFile.split('05_components/')[1] + '' +
              ' Seed: ' + comp.seedFile.split('05_components/')[1] + '' +
               ' -->\n'
            // Add rendered string
            compHTML += rendered
            // Comment after
            compHTML += '\n<!-- Component END: "' + comp.name + '" -->\n'

            combinedHTML[index] = compHTML
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
    const name = pageOpts.name || 'index'

    log.add('start page: ' + name)
    let pageStart = Date.now()

    let prepend = options.beforeEach.components || []
    let append = options.afterEach.components || []

    let components = prepend.concat(pageOpts.components).concat(append)

    // generate componentsObjects
    let componentsObjects = components.map(comp => {
      let name = comp
      let variant = 'default'
      let addComponentSeed = {}

      if (typeof comp === 'object') {
        name = comp.component
        if (comp.seed) {
          addComponentSeed = comp.seed
        }
      }

      if (name.indexOf('/') !== -1) {
        let nameSplit = name.split('/')
        name = nameSplit[0]
        variant = nameSplit[nameSplit.length - 1]
      }

      let base = path.join(__dirname, componentsPath) + name

      let rt = {
        name,
        addComponentSeed,
        srcFile: base + '/templates/' + variant + fileExtension,
        seedFile: base + '/seed.default.js'
      }

      // check if template file exists
      let tmpFileExists = fs.existsSync(rt.srcFile)
      let seedFileExists = fs.existsSync(rt.seedFile)

      if (!tmpFileExists) {
        console.log('\n\'' + rt.srcFile + '\'', 'was not found')
      }

      rt.seedData = fs.existsSync(rt.seedFile) ? require(rt.seedFile) : false
      if (tmpFileExists && this.relatedFiles.indexOf(rt.srcFile) === -1 && rt.srcFile !== '' && rt.srcFile) {
        this.relatedFiles.push(rt.srcFile)
      }
      if (seedFileExists && this.relatedFiles.indexOf(rt.seedFile) === -1 && rt.seedFile !== '' && rt.seedFile) {
        this.relatedFiles.push(rt.seedFile)
      }

      return rt
    })

    this.renderComponents(componentsObjects, (allHTML) => {
      let distPath = path.join(__dirname, './dist/')
      let fileExtension = (options.fileExtension || 'html')

      if (pageOpts.index !== true) {
        if (!fs.existsSync(distPath + pageOpts.route)) {
          fs.mkdirSync(distPath + pageOpts.route)
        }
        distPath += pageOpts.route + '/'
      }

      log.add('page done ' + name + ' - ' + (Date.now() - pageStart) + 'ms')

      tidy(allHTML, {
        doctype: 'html5',
        indent: true
      }, (err, html) => {
        if (err) {
          console.log('error writing file', distPath)
          return
        }
        let writeFile = distPath + 'index.' + fileExtension
        fs.writeFile(writeFile, html, 'utf8', _ => {})
      })
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

function simpleStringify (object) {
  var simpleObject = {}
  for (var prop in object) {
    if (!object.hasOwnProperty(prop)) {
      continue
    }
    if (typeof (object[prop]) === 'object') {
      continue
    }
    if (typeof (object[prop]) === 'function') {
      continue
    }
    simpleObject[prop] = object[prop]
  }
  return JSON.stringify(simpleObject) // returns cleaned up JSON
};

let initialBuild = true
peregrine.prototype.apply = function (compiler) {
  this.distPath = compiler.options.output.path

  compiler.plugin('emit', function (compilation, callback) {
    let directory = path.join(__dirname, './dist')
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory)
    } else {
      // deleteFolderRecursive(directory)
      // fs.mkdirSync(directory)
    }

    fs.readdir(directory, (err, files) => {
      log.clear()
      if (err) throw err

      if (initialBuild) {
        initialBuild = false
        // delete dist repository
        if (fs.existsSync(directory)) {
          rimraf.sync(directory)
          // shell.rm('-rf', directory)
          fs.mkdirSync(directory)
        }
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

      this.compilation.fileDependencies.push(path.join(__dirname, './src/pages.js'))
      this.watchFiles()
      callback()
    })
  }.bind(this))
}

module.exports = peregrine
