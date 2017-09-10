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
      name: 'qwe',
      components: ['image']
    },
    {
      name: '123123',
      components: ['image']
    }
  ]
}
