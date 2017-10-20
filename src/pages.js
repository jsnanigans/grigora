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
        'contact'
      ]
    }
    // {
    //   name: 'contact',
    //   components: [
    //     'image',
    //     'contact'
    //   ]
    // }
  ]
}
