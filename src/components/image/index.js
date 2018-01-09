require('./style/img.styl')

const colorClass = 'c-text-primary'
document.querySelectorAll('.js-image').forEach(item =>
  item.addEventListener('click', e => {
    item.classList.value.indexOf(colorClass) !== -1 ? item.classList.remove(colorClass) : item.classList.add(colorClass)
  })
)
