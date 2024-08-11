import { FormatParser } from './parser.js'
import { addTypeParser, removeTypeParser } from './type.js'
import { addDataParser, removeDataParser } from './data.js'
const formats = {}
export function add(format, parsers) {
  const formatParser = new FormatParser(format, parsers)
  formatParser.validate()
  const index = formats[format] || (formats[format] = {})
  if (formatParser.typeParser) {
    addTypeParser(format, formatParser.typeParser)
    index.type = true
  }
  if (formatParser.dataParser) {
    addDataParser(format, formatParser.dataParser)
    index.data = true
  }
  if (formatParser.asyncDataParser) {
    addDataParser(format, formatParser.asyncDataParser)
    index.asyncData = true
  }
  if (parsers.outputs) {
    index.outputs = parsers.outputs
  }
}
export function get(format) {
  return formats[format]
}
export function remove(format) {
  const index = formats[format]
  if (!index) {
    return
  }
  if (index.type) {
    removeTypeParser(format)
  }
  if (index.data) {
    removeDataParser(format)
  }
  if (index.asyncData) {
    removeDataParser(format, true)
  }
  delete formats[format]
}
export function has(format) {
  return format in formats
}
export function list() {
  return Object.keys(formats)
}
