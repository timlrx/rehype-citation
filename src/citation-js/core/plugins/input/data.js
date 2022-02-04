import { chain, chainAsync } from './chain.js'

const flatten = (array) => [].concat(...array)

const parsers = {}
const asyncParsers = {}
const nativeParsers = {
  '@csl/object': (input) => [input],
  '@csl/list+object': (input) => input,
  '@else/list+object': (input) => flatten(input.map(chain)),
  '@invalid': () => {
    throw new Error('This format is not supported or recognized')
  },
}
const nativeAsyncParsers = {
  '@else/list+object': async (input) => flatten(await Promise.all(input.map(chainAsync))),
}
export const data = (input, type) => {
  if (typeof parsers[type] === 'function') {
    return parsers[type](input)
  } else if (typeof nativeParsers[type] === 'function') {
    return nativeParsers[type](input)
  } else {
    throw new TypeError(`No synchronous parser found for ${type}`)
  }
}
export const dataAsync = async (input, type) => {
  if (typeof asyncParsers[type] === 'function') {
    return asyncParsers[type](input)
  } else if (typeof nativeAsyncParsers[type] === 'function') {
    return nativeAsyncParsers[type](input)
  } else if (hasDataParser(type, false)) {
    return data(input, type)
  } else {
    throw new TypeError(`No parser found for ${type}`)
  }
}
export const addDataParser = (format, { parser, async }) => {
  if (async) {
    asyncParsers[format] = parser
  } else {
    parsers[format] = parser
  }
}
export const hasDataParser = (type, async) =>
  async ? asyncParsers[type] || nativeAsyncParsers[type] : parsers[type] || nativeParsers[type]
export const removeDataParser = (type, async) => {
  delete (async ? asyncParsers : parsers)[type]
}
export const listDataParser = (async) => Object.keys(async ? asyncParsers : parsers)
