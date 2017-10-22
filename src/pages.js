module.exports = {
  globalSeed: {
    navigation: [
      {
        slug: '',
        name: 'Home'
      },
      {
        slug: '/coqntact',
        name: 'Contact'
      }
    ]
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
      components: [
        'image',
        'image',
        'image',
        'image',
        'image',
        'image',
        'image',
        'image',
        'image',
        'image',
        'image',
        'image'
      ]
    },
    {
      route: 'coqntact',
      name: 'Contact',
      components: [
        'image',
        'contact'
      ]
    }
  ]
}
