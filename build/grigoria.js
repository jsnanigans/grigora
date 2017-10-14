const fs = require('fs')
const ejs = require('ejs')
const path = require('path')

const componentsPath = '../src/components/'

var assets = []

function requireUncached(module){
  delete require.cache[module]
  return require(module)
}

function grigoria(options) {
  // this.options = options
  this.configFile = options.config || false
  this.config = {}
  this.relatedFiles = [];

  this.readModuleTemplate = (path, callback) => {
    try {
        var filename = require.resolve(path);
        fs.readFile(filename, 'utf8', callback);
    } catch (e) {
        callback(e);
    }
  }

  this.loadConfig = _ => {
    if (this.configFile) {
      this.config = requireUncached(this.configFile)
    }
  }

  this.startTime = Date.now()
  this.prevTimestamps = {}

  this.generateSinglePage = (pageOpts, options) => {
    const name = pageOpts.name
    let prepend = options.beforeEach.components || []
    let append = options.afterEach.components || []

    let components = prepend.concat(pageOpts.components).concat(append)

    let combinedHTML = ''

    let componentsObjects = components.map(comp => {
      let base = path.join(__dirname, componentsPath) + comp

      let rt = {
        name: comp,
        srcFile: base + '/' + comp + '.ejs',
        seedFile: base + '/seeds.js',
      }

      let configPath = base + '/config.grigoria.js'
      if (fs.existsSync(configPath)) {
        if (this.relatedFiles.indexOf(configPath) === -1 && configPath !== '' && configPath) {
          this.relatedFiles.push(configPath)
        }
        let conf = {}
        try {
          conf = requireUncached(configPath)
        } catch (e) {
          console.log('error reading: ' + configPath)
        }

        if (conf.template) {
         if (conf.template.default) {
           rt.srcFile = base + '/' + conf.template.default
          } else {
            rt.srcFile = base + '/' + conf.template
         }
        }
        if (conf.seed) {
         if (conf.seed.default) {
           rt.seedFile = base + '/' + conf.seed.default
          } else {
            rt.seedFile = base + '/' + conf.seed
         }
        }
      }

      rt.seedData = fs.existsSync(rt.seedFile) ? requireUncached(rt.seedFile) : false

      if (this.relatedFiles.indexOf(rt.srcFile) === -1 && rt.srcFile !== '' && rt.srcFile) {
        this.relatedFiles.push(rt.srcFile)
      }
      if (fs.existsSync(rt.seedFile) && this.relatedFiles.indexOf(rt.seedFile) === -1 && rt.seedFile !== '' && rt.seedFile) {
        this.relatedFiles.push(rt.seedFile)
      }

      return rt
    })

    let renderComponent = (ind) => {
      let comp = componentsObjects[ind]


      this.readModuleTemplate(comp.srcFile, function (err, body) {
        let rendered = ''
        try {
          rendered = ejs.render(body, comp.seedData)
        } 
        catch (e) {
          console.log(e)
        }
        
        combinedHTML += rendered + '\n'

        let assetSources = ''
        assets.forEach(asset => {
          assetSources += '<script type="text/javascript" src="' + asset + '"></script>'
        })

        combinedHTML = combinedHTML.replace('{{insert_assets}}', assetSources)

        if (componentsObjects[ind + 1]) {
          renderComponent(ind + 1)
        } else {
          fs.writeFile(path.join(__dirname, '../pages/') + name + '.' + (options.fileEnding || '.html'), combinedHTML, 'utf8', _ => {});
        }

      });
    }
    
    renderComponent(0)
  }

  this.watchFiles = _ => {
    this.relatedFiles.forEach(file => {
      this.compilation.fileDependencies.push(file)
    })
  }

  this.generatePages = _ => {
    // gernerate pages

    const conf = this.config
    const options = conf.options || {}
    const pages = conf.pages || []

    pages.forEach(page => {
      this.generateSinglePage(page, options)
    })
  }
}

grigoria.prototype.apply = function (compiler) {

  this.distPath = compiler.options.output.path
  compiler.plugin('emit', function (compilation, callback) {
    // console.log(compilation.assets)
    assets = []
    Object.keys(compilation.assets).forEach(key => {
      assets.push('/' + key)
    })

    let directory = path.join(__dirname, '../pages')
    fs.readdir(directory, (err, files) => {
      if (err) throw err;
    
      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw error;
        });
      }


      var changedFiles = Object.keys(compilation.fileTimestamps).filter(function (watchfile) {
        return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity);
      }.bind(this));

  
      changedFiles.forEach(file => {
        if (file === this.configFile) {
          this.loadConfig()
        }
        if (file === this.configFile || this.relatedFiles.indexOf(file) !== -1) {
          this.generatePages()

          if (compilation.hotMiddleware) {
            setTimeout(_ => {
              compilation.hotMiddleware.publish({ action: 'reload' })
            })
          }
        }
      })
      
      this.prevTimestamps = compilation.fileTimestamps;
      this.compilation = compilation
  
      this.loadConfig()
      this.generatePages()
  
      this.compilation.fileDependencies.push(path.join(__dirname, '../src/routes.js'))
      this.watchFiles()
  
      callback();
    });

  }.bind(this));
};

module.exports = grigoria;
