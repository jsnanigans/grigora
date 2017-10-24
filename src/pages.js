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
      inNavigation: true,
      components: [
        'image',
        {
          name: 'image',
          seed: {
            items: ['unos', 'dos', 'tres']
          }
        },
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
      route: 'contact',
      name: 'Contact',
      inNavigation: true,
      components: [
        'image',
        'contact'
      ]
    },
    {
      route: 'secret',
      inNavigation: false,
      components: [
        'image'
      ]
    }
  ]
}
