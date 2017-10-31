// import $ from 'jquery'

require('./style/img.styl')
console.log('init image')

document.querySelectorAll('.js-image').addEventListener('click', e => {
  e.target.classList.indexOf('color-red') !== -1 ? e.target.classList.remove('color-red') : e.target.classList.add('color-red')
})
