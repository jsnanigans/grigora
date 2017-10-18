# perigrine
> Static site generator with webpack

![Dependencies](https://david-dm.org/jsnanigans/perigrine.svg)

## Build Setup
``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build # not done
```

to add templates edit `src/routes.js`
```javascript
  ...
  pages: [
    {
      name: 'template-name',
      components: [...components]
  ]
}
```
the components are in `src/components`, the component name is the directory name.
there mus be a `.ejs` file inside the component root with the same name.
for example: `src/components/image/image.ejs`:
```ejs
<div>
  <h1>Image</h1>
  <%= things.join(", ")  %>
</div>
```

To insert data into the ejs template, create `seeds.js` inside the component root that exports a object:
```javascript
module.exports = {
  things: ['Hi', 'Val', 'Paris']
}
```

# Options
To configure perigrine, change `options` in `routes.js`

### fileEnding
> define the file ending of the template files that are created
```javascript
// default
options: {
  fileEnding: 'html'
}
```

### beforeEach
> add a module to the start of every page
```javascript
// default
options: {
  beforeEach: {
    components: ['_head']
  }
}
```

### afterEach
> add a module to the end of every page
```javascript
// default
options: {
  afterEach: {
    components: ['_foot']
  }
}
```