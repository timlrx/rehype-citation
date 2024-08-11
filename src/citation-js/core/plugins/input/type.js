import logger from '../../logger.js'
import { dataTypeOf } from './dataType.js'
const types = {}
const dataTypes = {}
const unregExts = {}
function parseNativeTypes(input, dataType) {
  switch (dataType) {
    case 'Array':
      if (input.length === 0 || input.every((entry) => type(entry) === '@csl/object')) {
        return '@csl/list+object'
      } else {
        return '@else/list+object'
      }
    case 'SimpleObject':
    case 'ComplexObject':
      return '@csl/object'
    default:
      return '@invalid'
  }
}
function matchType(typeList = [], data) {
  for (const type of typeList) {
    if (types[type].predicate(data)) {
      return matchType(types[type].extensions, data) || type
    }
  }
}
export function type(input) {
  const dataType = dataTypeOf(input)
  if (dataType === 'Array' && input.length === 0) {
    return parseNativeTypes(input, dataType)
  }
  const match = matchType(dataTypes[dataType], input)
  return match || parseNativeTypes(input, dataType)
}
export function addTypeParser(format, { dataType, predicate, extends: extend }) {
  let extensions = []
  if (format in unregExts) {
    extensions = unregExts[format]
    delete unregExts[format]
    logger.debug(
      '[core]',
      `Subclasses "${extensions}" finally registered to parent type "${format}"`
    )
  }
  const object = {
    predicate,
    extensions,
  }
  types[format] = object
  if (extend) {
    const parentTypeParser = types[extend]
    if (parentTypeParser) {
      parentTypeParser.extensions.push(format)
    } else {
      if (!unregExts[extend]) {
        unregExts[extend] = []
      }
      unregExts[extend].push(format)
      logger.debug('[core]', `Subclass "${format}" is waiting on parent type "${extend}"`)
    }
  } else {
    const typeList = dataTypes[dataType] || (dataTypes[dataType] = [])
    typeList.push(format)
  }
}
export function hasTypeParser(type) {
  return Object.prototype.hasOwnProperty.call(types, type)
}
export function removeTypeParser(type) {
  delete types[type]
  const typeLists = [
    ...Object.keys(dataTypes).map((key) => dataTypes[key]),
    ...Object.keys(types)
      .map((type) => types[type].extensions)
      .filter((list) => list.length > 0),
  ]
  typeLists.forEach((typeList) => {
    const index = typeList.indexOf(type)
    if (index > -1) {
      typeList.splice(index, 1)
    }
  })
}
export function listTypeParser() {
  return Object.keys(types)
}
export function treeTypeParser() {
  const attachNode = (name) => ({
    name,
    children: types[name].extensions.map(attachNode),
  })
  return {
    name: 'Type tree',
    children: Object.keys(dataTypes).map((name) => ({
      name,
      children: dataTypes[name].map(attachNode),
    })),
  }
}
export const typeMatcher = /^(?:@(.+?))(?:\/(?:(.+?)\+)?(?:(.+)))?$/
