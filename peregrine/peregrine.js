const WPS = require('webpack-sources')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
// const shell = require('shelljs')
const rimraf = require('rimraf')
const encrypt = require('crypto-js/md5')
const tidy = require('htmltidy').tidy
const purify = require('purifycss-extended')

const logEnabled = false
let showErrors = false

if (process.env.NODE_ENV === 'development') {
  showErrors = true
}

const componentsPath = './src/05_components/'
const fileExtension = '.ejs'
let globalSeed = {}

const usedTemplates = []

const cacheAge = 1.2e+6 // 20 minutes

const componentCache = {}
const componentAssets = {}
const fileCache = {}

function peregrine (options) {
  this.configFile = options.config || false
  this.tempDir = path.join(__dirname, '.peregrine-temp')
  this.tempFile = path.join(this.tempDir, 'data.json')
  this.config = {}
  this.relatedFiles = []

  if (!fs.existsSync(this.tempDir)) {
    fs.mkdirSync(this.tempDir)
  }

  this.log = {
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

  this.dropCache = (name) => {
    const dropAll = name === '*'

    // crear file from componentCache
    Object.keys(componentCache).forEach(key => {
      if (key.indexOf(name) !== -1 || dropAll) {
        delete componentCache[key]
      }
    })

    // clear file cache
    if (fileCache[name]) {
      delete fileCache[name]
    }

    // clear componentCache if include is updates
    Object.keys(componentAssets).forEach(key => {
      if (name === key || dropAll) {
        componentAssets[key].forEach(compKey => {
          if (componentCache[compKey]) {
            delete componentCache[compKey]
          }
        })
      }
    })
  }

  if (options.setPaths) {
    options.setPaths(usedTemplates)
  }

  const layoutTemplateRegex = /\{\{+(layout) '+(.*)'\}\}/g
  const partTemplateRegex = /\{\{+(part) '+(.*)'\}\}/g

  this.parseAssetPath = assetPath => {
    const basePath = path.join(__dirname, '../src')
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

  const wasMinified = []
  // purify assets
  this.purify = () => {
    if (options.env === 'development') {
      return
    }

    this.compilation.chunks.forEach(
      ({ name: chunkName }) => {
        const allAssets = Object.keys(this.compilation.assets).map(o => {
          const rt = this.compilation.assets[o]
          rt.name = o
          return rt
        })

        const jsAssetsTempFile = path.join(this.tempDir, 'purify-js-assets.js')

        const assetsToPurify = allAssets.filter(o => o.name.endsWith('.css'))
        let assetsToInclude = allAssets.filter(o => o.name.endsWith('.js'))

        assetsToInclude = assetsToInclude.map(asset => {
          return asset.children[0].source()
        })

        fs.writeFileSync(jsAssetsTempFile, assetsToInclude, 'utf8')

        assetsToPurify.forEach(asset => {
          const name = asset.name

          if (wasMinified.indexOf(name) !== -1) {
            return
          }

          const sourceAssets = Object.keys(componentCache)
            .map(key => key.split('++')[0])
            .filter(file => fs.existsSync(file))

          sourceAssets.push(jsAssetsTempFile)

          let purified = purify(
            sourceAssets,
            asset.source(),
            {
              minify: true
              // info: true
            }
          )

          purified = purified.replace(/\//g, '\\/')

          this.compilation.assets[name] = new WPS.ConcatSource(purified)

          wasMinified.push(name)
        })
      }
    )
  }

  // resolve custom includes and replace with the tempalte
  this.includeLayouts = (template, cacheName) => {
    let match
    do {
      match = layoutTemplateRegex.exec(template)
      if (match) {
        const snippet = match[0]
        let assetPath = match[1]
        const layoutName = match[2]

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
          const fileContent = fs.readFileSync(resolvedPath, 'utf8')
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
        const snippet = match[0]
        let assetPath = match[1]
        const layoutName = match[2]

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
          const fileContent = fs.readFileSync(resolvedPath, 'utf8')
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
    const errorText = `
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
          const fileContent = fs.readFileSync(filename, 'utf8')
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
      this.dropCache('*')

      this.config = require(this.configFile)
      if (this.config.globalSeed) {
        globalSeed = this.config.globalSeed
        this.generateNavigations()

        // const genNavs = {}
        // this.config.pages.map(page => {
        // if (page.navigation) {
        //   if (!genNavs[page.navigation]) {
        //     genNavs[page.navigation] = []
        //   }

        //   genNavs[page.navigation].push({
        //     name: page.name,
        //     slug: page.index ? '/' : '/' + page.route
        //   })
        // }
        // })

        // globalSeed.generatedNavigation = genNavs
      }
    }
  }

  this.generateNavigations = _ => {
    const navs = this.config.navigation

    // if (!this.config.globalSeed) { this.config.globalSeed = {} }
    this.config.globalSeed.autoNav = {}

    const genTree = tree => {
      const generated = []

      Object.keys(tree).forEach(item => {
        const page = this.config.pages[item]
        if (page) {
          generated.push({
            name: page.name,
            slug: page.slug || page.name.toLowerCase().replace('/ /', '-')
          })
        }
      })

      return generated
    }

    Object.keys(navs).forEach(nav => {
      const tree = navs[nav]
      this.config.globalSeed.autoNav[nav] = genTree(tree)
    })
  }

  this.startTime = Date.now()
  this.prevTimestamps = {}

  let initialInsert = true
  this.insertAssets = (html) => {
    if (initialInsert) {
      initialInsert = false
    }

    let assets = {
      css: {},
      js: {}
    }

    if (this.compilation) {
      Object.keys(this.compilation.assets).forEach(file => {
        const asset = this.compilation.assets[file]

        if (file.endsWith('.js')) {
          assets.js[file] = asset.source()
        }

        if (file.endsWith('.css')) {
          assets.css[file] = asset.source()
        }
      })

      fs.writeFileSync(this.tempFile, JSON.stringify(assets))
    } else {
      if (fs.existsSync(this.tempFile)) {
        const tempFileContent = fs.readFileSync(this.tempFile)
        assets = JSON.parse(tempFileContent)
      } else {
        console.log('Temp file not found: ' + this.tempFile + ' \n |- Run "yarn build" to create it')
      }
    }

    if (html.indexOf('{{insert_scripts}}') !== -1) {
      const scripts = []

      Object.keys(assets.js).forEach(file => {
        scripts.push('<script type="text/javascript" src="/' + file + '"></script>')
      })

      html = html.replace('{{insert_scripts}}', scripts.join(''))
    }

    if (html.indexOf('{{insert_styles}}') !== -1) {
      const scripts = []

      Object.keys(assets.css).forEach(file => {
        if (file.indexOf('crit.') !== -1) {
          scripts.push(`<style>${assets.css[file]}</style>`)
        } else {
          scripts.push(`<link rel="stylesheet" href="/${file}" media="none" onload="if(media!='all')media='all'">
          <noscript><link rel="stylesheet" href="/${file}"></noscript>`)
        }
        // scripts.push('<link rel="stylesheet" href="/' + file + '" />')
      })

      html = html.replace('{{insert_styles}}', scripts.join(''))
    }

    return html
  }

  this.cleanOldComponentCache = _ => {
    const now = Date.now()
    Object.keys(componentCache).forEach(key => {
      const date = componentCache[key][0]
      if (now - cacheAge < date) {
        // delete componentCache[key]
      }
    })
  }

  const renderTemplate = (body, seed, cacheName, comp) => {
    let useCacheIfExists = true

    if (comp.options) {
      useCacheIfExists = !!comp.options.cache
    }

    const cached = useCacheIfExists ? componentCache[cacheName] || [false, false] : false
    const now = Date.now()

    if (cached[0] !== false &&
      now - cacheAge < cached[0]) {
      cached[0] = now

      return cached[1]
    }

    let rendered = ''

    body = this.includeTemplatesRecursive(body, cacheName)
    try {
      if (body) {
        seed = Object.assign({}, globalSeed, seed)
        rendered = ejs.render(body, seed)

        if (useCacheIfExists) {
          componentCache[cacheName] = [now, rendered]
        }
      }
    } catch (e) {
      console.log(e)
    }

    return rendered
  }

  this.renderSingleComponent = (comp, rtfn) => {
    this.readModuleTemplate(comp.srcFile, body => {
      if (!body) {
        body = ''
      }

      const cacheName = comp.srcFile + '++' + comp.seedFile
      const seed = Object.assign({}, comp.seedData, comp.addComponentSeed)
      const seedString = JSON.stringify(seed)
      const hash = encrypt(seedString, 'secret').words.join('')

      const rendered = renderTemplate(body, seed, cacheName + '--' + hash, comp)

      if (rtfn) {
        rtfn(rendered)
      } else {
        return rendered
      }
    })
  }

  this.renderComponents = (componentsObjects, modulesDone) => {
    const combinedHTML = []
    const comps = componentsObjects
    const sync = true

    let compsDone = 0
    const compsTotal = comps.length

    if (compsTotal) {
      if (!sync) {
        // sync components
        const compCallback = rendered => {
          // Comment before
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
    const prepend = options.beforeEach.components || []
    const append = options.afterEach.components || []

    const components = prepend.concat(pageOpts.components).concat(append)

    // generate componentsObjects
    const componentsObjects = components.map(comp => {
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
        const nameSplit = name.split('/')
        name = nameSplit[0]
        variant = nameSplit[nameSplit.length - 1]
      }

      const base = path.join(__dirname, '../' + componentsPath) + name

      const rt = {
        name,
        addComponentSeed,
        srcFile: base + '/templates/' + variant + fileExtension,
        seedFile: base + '/seed.default.js',
        optionsFile: base + '/peregrine.options.js'
      }

      // check if template file exists
      const tmpFileExists = fs.existsSync(rt.srcFile)
      const seedFileExists = fs.existsSync(rt.seedFile)

      if (!tmpFileExists) {
        console.log('\n\'' + rt.srcFile + '\'', 'was not found')
      }

      rt.options = fs.existsSync(rt.optionsFile) ? require(rt.optionsFile) : false

      if (rt.options) {
        this.relatedFiles.push(rt.optionsFile)
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
      let distPath = path.join(__dirname, '../dist/')
      const fileExtension = (options.fileExtension || 'html')

      if (pageOpts.index !== true) {
        if (!fs.existsSync(distPath + pageOpts.route)) {
          fs.mkdirSync(distPath + pageOpts.route)
        }
        distPath += pageOpts.route + '/'
      }

      // this.purify()
      // allHTML = insertAssets(allHTML)

      tidy(allHTML, {
        doctype: 'html5',
        indent: true
      }, (err, html) => {
        if (err) {
          console.log('error writing file', distPath)
          return
        }
        const writeFile = distPath + 'index.' + fileExtension
        // fs.writeFile(writeFile, html, 'utf8', _ => {})
        pageDone(writeFile, html)
      })
    })
  }

  this.watchFiles = _ => {
    this.compilation.fileDependencies.push(path.join(__dirname, '../src/pages.js'))
    this.relatedFiles.forEach(file => {
      this.compilation.fileDependencies.push(file)
    })
  }

  this.generatePages = done => {
    const conf = this.config
    const options = conf.options || {}
    const pageList = []

    const pages = Object.keys(conf.pages).map(pageKey => {
      const page = conf.pages[pageKey]
      page.key = pageKey

      if (!page.route && page.index !== true) {
        page.route = page.name.toLowerCase()
      }
      if (page.index === true) {
        page.route = '/'
      }

      return page
    })

    let pagesDone = 0
    pages.forEach(page => {
      this.generatePage(page, options, (file, content) => {
        pagesDone++

        pageList.push({ file, content })
        if (pagesDone === pages.length) {
          done(pageList)
        }
      })
    })
  }

  this.initial = true
}

let initialBuild = true

peregrine.prototype.apply = function (compiler) {
  this.distPath = compiler.options.output.path

  compiler.plugin('emit', function (compilation, callback) {
    const directory = path.join(__dirname, '../dist')
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory)
    } else {
    }

    fs.readdir(directory, (err, files) => {
      if (err) throw err

      if (initialBuild) {
        initialBuild = false
        // delete dist repository
        if (fs.existsSync(directory)) {
          rimraf.sync(directory)
          fs.mkdirSync(directory)
        }
      }

      var changedFiles = Object.keys(compilation.fileTimestamps).filter(function (watchfile) {
        return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity)
      }.bind(this))

      changedFiles.forEach(file => {
        delete require.cache[file]
        this.dropCache(file)
        if (file === this.configFile) {
          this.loadConfig()
        }
        if (file === this.configFile || this.relatedFiles.indexOf(file) !== -1) {
          this.generatePages(pageList => {
            this.purify()
            pageList.forEach(page => {
              const html = this.insertAssets(page.content)
              fs.writeFileSync(page.file, html, 'utf8')
            })

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
        this.generatePages(pageList => {
          this.purify()
          pageList.forEach(page => {
            const html = this.insertAssets(page.content)
            fs.writeFileSync(page.file, html, 'utf8')
          })

          callback()
        })
      } else {
        callback()
      }
      this.watchFiles()
    })
  }.bind(this))
}

module.exports = peregrine
