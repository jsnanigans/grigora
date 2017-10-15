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
      name: 'index',
      components: [
        'image',
        'image',
        'image',
        'image',
        'image',
        'image'
      ]
    }
  ]
}
