import { plugins } from '../../core/index.js'
import { format as mapBiblatex, formatBibtex as mapBibtex } from './entries.js'
import { format } from './bibtex.js'
import { format as formatBibtxt } from './bibtxt.js'
const factory = function (mapper, formatter) {
  return function (data, opts = {}) {
    const { type, format = type || 'text' } = opts
    data = mapper(data)
    if (format === 'object') {
      return data
    } else if (plugins.dict.has(format)) {
      return formatter(data, plugins.dict.get(format), opts)
    } else {
      throw new RangeError(`Output dictionary "${format}" not available`)
    }
  }
}
export default {
  bibtex: factory(mapBibtex, format),
  biblatex: factory(mapBiblatex, format),
  bibtxt: factory(mapBibtex, formatBibtxt),
}
