module.exports = {
  globalSeed: {
    navigation: [
      {
        slug: '',
        name: 'Home'
      },
      {
        slug: '/contact',
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
      name: 'contact',
      components: [
        'image',
        'contact'
      ]
    }
  ]
}
