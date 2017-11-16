const printErr = (err, pathArray) => {
  console.error('\n' + pathArray.join('.'))
  console.error(err)
  return err
}

const fileType = 'ejs'

const createPath = pathArray => {
  const path = []
  const arr = [...pathArray]

  // if there is no teplate defined, use default
  if (arr.length === 2) {
    arr.push('default')
  }

  if (arr.length !== 3) {
    return printErr('ERR: Path is incorrect, must be 2 or three sections long', pathArray)
  }

  // 0 = part or layout
  if (arr[0] === 'part' || arr[0] === 'layout') {
    if (arr[0] === 'part') {
      path.push('03_parts')
    }
    if (arr[0] === 'layout') {
      path.push('04_layouts')
    }
  } else {
    return printErr('Firt section must be either "part" or "layout"')
  }

  // 1 = name
  // todo: check if it exists
  path.push(arr[1])

  // 2 = tempalte file
  // todo: check if it exists
  path.push(arr[2] + '.' + fileType)

  return path.join('/')
}

const parseTag = (match, level) => {
  const use = {}
  let opts = []
  for (let i = 0; i < match.length; i++) {
    if (i > 1) {
      opts.push(match[i])
    }
  }
  opts = opts.join('').replace(/(\n|\ )/g, '').split(',')

  opts.forEach(optLine => {
    const separated = optLine.split(':')
    use[separated[0]] = createPath(separated[1].split('.'))
  })

  return use
}

module.exports = {
  parse: parseTag
}
