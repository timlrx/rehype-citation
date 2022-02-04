//@ts-nocheck
import * as log from './log.js'
import * as options from './options.js'
import * as set from './set.js'
import * as sort from './sort.js'
import * as get from './get.js'
import * as staticMethods from './static.js'

function Cite(data, options = {}) {
  if (!(this instanceof Cite)) {
    return new Cite(data, options)
  }

  this._options = options
  this.log = []
  this.data = []
  this.set(data, options)
  this.options(options)
  return this
}

Object.assign(Cite.prototype, log, options, set, sort, get)

Cite.prototype[Symbol.iterator] = function* () {
  yield* this.data
}

Object.assign(Cite, staticMethods)
export default Cite
