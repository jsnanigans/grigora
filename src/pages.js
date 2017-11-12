const faker = require('faker')

module.exports = {
  globalSeed: {
    faker
  },

  options: {
    fileEnding: 'html',

    beforeEach: {
      components: ['_head', 'navigation']
    },
    afterEach: {
      components: ['_foot']
    }
  },

  navigation: {
    'main': {
      'main-page': {},
      'test_contact': {},
      'color-demo': {}
    }
  },

  pages: {
    'main-page': {
      name: 'Home',
      index: true,
      components: [
        'hero/cols',
        'image',
        {
          component: 'image',
          seed: {
            items: [
              faker.name.findName(),
              faker.name.findName(),
              faker.name.findName()
            ]
          }
        },
        {
          component: 'image/small',
          seed: {
            items: 'abcdefghijklmnopqrstuvxyz'.split('')
          }
        },
        'image/placeholder',
        'image',
        'image',
        'image',
        'image',
        'image'
      ]
    },
    'test_contact': {
      name: 'Contact',
      components: [
        'image',
        'contact'
      ]
    },
    'color-demo': {
      name: 'Colors',
      components: [
        'demos/colors'
      ]
    }
  }
}
