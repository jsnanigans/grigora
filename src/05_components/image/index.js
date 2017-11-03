require('./style/img.styl')

document.querySelectorAll('.js-image').forEach(item =>
  item.addEventListener('click', e => {
    item.classList.value.indexOf('color-red') !== -1 ? item.classList.remove('color-red') : item.classList.add('color-red')
  })
)
