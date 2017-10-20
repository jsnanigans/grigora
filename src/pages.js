module.exports = {
  options: {
    fileEnding: 'html',

    beforeEach: {
      components: ['_head']
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
