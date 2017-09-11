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
      name: 'demo',
      components: ['image']
    }
  ]
}
