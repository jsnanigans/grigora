const faker = require('faker')

module.exports = {
  globalSeed: {
    navigation: [],
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
  pages: [
    {
      index: true,
      name: 'Home',
      navigation: 'main',
      components: [
        'hero',
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
    {
      route: 'contact',
      name: 'Contact',
      navigation: 'main',
      components: [
        'image',
        'contact'
      ]
    },
    {
      route: 'colors',
      name: 'Colors',
      navigation: 'main',
      components: [
        'demos/colors'
      ]
    }
  ]
}
