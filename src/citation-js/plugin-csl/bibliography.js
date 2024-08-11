import { util } from '../core/index.js'
import prepareEngine from './engines.js'
import { getPrefixedEntry } from './attr.js'
const getAffix = (source, affix) => (typeof affix === 'function' ? affix(source) : affix || '')
export default function bibliography(data, options = {}) {
  const { template = 'apa', lang, format = 'text', nosort = false } = options
  const ids = options.entry ? [].concat(options.entry) : data.map(({ id }) => id)
  data = util.downgradeCsl(data)
  const citeproc = prepareEngine(data, template, lang, format)
  const sortedIds = citeproc.updateItems(ids, nosort)
  if (options.append || options.prepend) {
    const items = data.reduce((items, entry) => {
      items[entry.id] = entry
      return items
    }, {})
    citeproc.sys.wrapBibliographyEntry = function (id) {
      const entry = items[id]
      return [getAffix(entry, options.prepend), getAffix(entry, options.append)]
    }
  }
  if (options.hyperlinks) {
    citeproc.opt.development_extensions.wrap_url_and_doi = true
  }
  const bibliography = citeproc.makeBibliography()
  const [{ bibstart, bibend }, bibBody] = bibliography
  const entries = bibBody.map((element, index) => getPrefixedEntry(element, sortedIds[index]))
  if (options.asEntryArray) {
    return entries.map((element, index) => [sortedIds[index], element])
  }
  return bibstart + entries.join('') + bibend
}
