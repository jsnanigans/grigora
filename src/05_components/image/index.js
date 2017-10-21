import $ from 'jquery'

require('./style/img.styl')
console.log('init image')

$(_ => {
  $('.js-image').on('click', function () {
    $(this).addClass('color-red')
  })
})
