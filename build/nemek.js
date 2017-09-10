const fs = require('fs')
const ejs = require('ejs')
const path = require('path')


function nemek(options) {
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
      this.config = (eval(fs.readFileSync(this.configFile.replace('module.exports =', 'return'))+''));
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
    
    components.forEach((comp, ci) => {
      // let mod = require()
      let srcFile = path.join(__dirname, '../src/components/') + comp + '/' + comp + '.ejs';

      if (this.relatedFiles.indexOf(srcFile) === -1) {
        this.relatedFiles.push(srcFile)
        this.compilation.fileDependencies.push(srcFile)
      }

      this.readModuleTemplate(srcFile, function (err, body) {
        let rendered = ejs.render(body, {}, {});
        combinedHTML += rendered + '\n';
        if (ci === components.length - 1) {
          fs.writeFile(path.join(__dirname, '../pages/') + name + '.' + (options.fileEnding || '.html'), combinedHTML, 'utf8', _ => {
          });
        }
      });
      // console.log(mod)
    })
  }

  this.generatePages = _ => {
    // gernerate pages

    const conf = this.config
    const options = conf.options || {}
    const pages = conf.pages || []

    // const beforeEach = options.beforeEach
    // const afterEach = options.afterEach

    pages.forEach(page => {
      this.generateSinglePage(page, options)
    })
  }
}


nemek.prototype.apply = function (compiler) {
  // console.log(compiler.options.output.path)
  // compiler.plugin('after-compile', function(compilation, callback) {
    
  //   // let related = this.relatedFiles || []
  //   // related.forEach(file => {
  //   //   if (compilation.fileDependencies.indexOf(file) === -1) {
  //   //     compilation.fileDependencies.push(file)
  //   //     console.log(add)
  //   //   }
  //   // })

  //   // compilation.fileDependencies.push("./app/worksheet.html");
  //   callback();
  // });


  this.distPath = compiler.options.output.path
  compiler.plugin('emit', function (compilation, callback) {

    let directory = path.join(__dirname, '../pages')
    fs.readdir(directory, (err, files) => {
      if (err) throw error;
    
      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw error;
        });
      }


      var changedFiles = Object.keys(compilation.fileTimestamps).filter(function (watchfile) {
        return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity);
      }.bind(this));
  
      changedFiles.forEach(file => {
        console.log(file)
        if (file === this.configFile) {
          this.loadConfig()
        }
        if (file === this.configFile || this.relatedFiles.indexOf(file) !== -1) {
          this.generatePages()
        }
      })
      
      this.prevTimestamps = compilation.fileTimestamps;
      this.compilation = compilation
  
      this.loadConfig()
      this.generatePages()
  
      this.compilation.fileDependencies.push(path.join(__dirname, '../src/routes.js'))
  
      callback();
    });

  }.bind(this));
};

module.exports = nemek;


// 
// function MyPlugin() {
//   this.startTime = Date.now();
//   this.prevTimestamps = {};
// }

// MyPlugin.prototype.apply = function (compiler) {
//   compiler.plugin('emit', function (compilation, callback) {

//     var changedFiles = Object.keys(compilation.fileTimestamps).filter(function (watchfile) {
//       return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity);
//     }.bind(this));

//     this.prevTimestamps = compilation.fileTimestamps;
//     callback();
//   }.bind(this));
// };

// module.exports = MyPlugin;
