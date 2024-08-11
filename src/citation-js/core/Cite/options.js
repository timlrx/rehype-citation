import { validateOutputOptions as validate } from './validate.js'
const defaultOptions = {
  format: 'real',
  type: 'json',
  style: 'csl',
  lang: 'en-US',
}
function options(options, log) {
  validate(options)
  if (log) {
    this.save()
  }
  Object.assign(this._options, options)
  return this
}
export { options, defaultOptions }
