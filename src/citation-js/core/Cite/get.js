import { validateOutputOptions as validate } from './validate.js'
import { format as formatData } from '../plugins/output.js'
import { clean as parseCsl } from '../plugins/input/csl.js'
export function getIds() {
  return this.data.map((entry) => entry.id)
}
export function format(format, ...options) {
  return formatData(format, parseCsl(this.data), ...options)
}
export function get(options = {}) {
  validate(options)
  const parsedOptions = Object.assign({}, this.defaultOptions, this._options.output, options)
  const { type, style } = parsedOptions
  const [styleType, styleFormat] = style.split('-')
  const newStyle =
    styleType === 'citation' ? 'bibliography' : styleType === 'csl' ? 'data' : styleType
  const newType = type === 'string' ? 'text' : type === 'json' ? 'object' : type
  let formatOptions
  switch (newStyle) {
    case 'bibliography': {
      const { lang, append, prepend } = parsedOptions
      formatOptions = {
        template: styleFormat,
        lang,
        format: newType,
        append,
        prepend,
      }
      break
    }
    case 'data':
    case 'bibtex':
    case 'bibtxt':
    case 'ndjson':
    case 'ris':
      formatOptions = {
        type: newType,
      }
      break
    default:
      throw new Error(`Invalid style "${newStyle}"`)
  }
  const result = this.format(newStyle, Object.assign(formatOptions, options._newOptions))
  const { format } = parsedOptions
  if (
    format === 'real' &&
    newType === 'html' &&
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function'
  ) {
    const tmp = document.createElement('div')
    tmp.innerHTML = result
    return tmp.firstChild
  } else if (format === 'string' && typeof result === 'object') {
    return JSON.stringify(result)
  } else {
    return result
  }
}
