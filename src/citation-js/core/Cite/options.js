import { validateOutputOptions as validate } from './validate.js'
const defaultOptions = {
  format: 'real',
  type: 'json',
  style: 'csl',
  lang: 'en-US',
}

const options = function (options, log) {
  validate(options)

  if (log) {
    this.save()
  }

  Object.assign(this._options, options)
  return this
}

export { options, defaultOptions }
