import { Cite as CiteCore, plugins } from './citation-js/core/index.js'
import './citation-js/plugin-bibjson/index.js'
import './citation-js/plugin-bibtex/index.js'
import './citation-js/plugin-csl/index.js'

function clone(obj) {
  const copy = {}
  for (const key in obj) {
    copy[key] = typeof obj[key] === 'object' ? clone(obj[key]) : obj[key]
  }
  return copy
}

function Cite(data, opts) {
  if (!(this instanceof Cite)) {
    return new Cite(data, opts)
  }

  const self = new CiteCore(data, opts)
  this._options = self._options
  this.log = self.log
  this.data = self.data
}

Cite.plugins = clone(plugins)

export default Cite
