import { getLabel } from '../plugin-common/output/label.js'
import { format as getName } from '@citation-js/name'

const getComparisonValue = function (obj, prop, label = prop === 'label') {
  let value = label ? getLabel(obj) : obj[prop]

  switch (prop) {
    case 'author':
    case 'editor':
      return value.map((name) => name.literal || name.family || getName(name))

    case 'accessed':
    case 'issued':
      return value['date-parts'][0]

    case 'page':
      return value.split('-').map((num) => parseInt(num))

    case 'edition':
    case 'issue':
    case 'volume':
      value = parseInt(value)
      return !isNaN(value) ? value : -Infinity

    default:
      return value || -Infinity
  }
}

const compareProp = function (entryA, entryB, prop, flip = /^!/.test(prop)) {
  prop = prop.replace(/^!/, '')
  const a = getComparisonValue(entryA, prop)
  const b = getComparisonValue(entryB, prop)
  return (flip ? -1 : 1) * (a > b ? 1 : a < b ? -1 : 0)
}

const getSortCallback = function (...props) {
  return (a, b) => {
    const keys = props.slice()
    let output = 0

    while (!output && keys.length) {
      output = compareProp(a, b, keys.shift())
    }

    return output
  }
}

const sort = function (method = [], log) {
  if (log) {
    this.save()
  }

  this.data.sort(typeof method === 'function' ? method : getSortCallback(...method, 'label'))
  return this
}

export { sort }
