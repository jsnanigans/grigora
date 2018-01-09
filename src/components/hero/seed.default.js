const faker = require('faker')

module.exports = {
  title: faker.lorem.sentence(),
  image: 'http://via.placeholder.com/600x1000',
  text: faker.lorem.paragraph()
}
