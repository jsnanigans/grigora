module.exports = {
  globalSeed: {
    navigation: []
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
        'navigation/buttons',
        'image',
        {
          component: 'image',
          seed: {
            items: ['unos', 'dos', 'tres']
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
      route: 'secret',
      navigation: 'footer',
      components: [
        'image'
      ]
    }
  ]
}
