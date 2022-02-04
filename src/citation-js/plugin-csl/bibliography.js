import prepareEngine from './engines.js'
import { getPrefixedEntry } from './attr.js'

const getAffix = (source, affix) => (typeof affix === 'function' ? affix(source) : affix || '')

export default function bibliography(data, options = {}) {
  const { template = 'apa', lang = 'en-US', format = 'text', nosort = false } = options
  const ids = options.entry ? [].concat(options.entry) : data.map(({ id }) => id)
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
  } else {
    citeproc.sys.wrapBibliographyEntry = () => ['', '']
  }

  const bibliography = citeproc.makeBibliography()
  const [{ bibstart, bibend }, bibBody] = bibliography
  const entries = bibBody.map((element, index) => getPrefixedEntry(element, sortedIds[index]))

  if (options.asEntryArray) {
    return entries.map((element, index) => [sortedIds[index], element])
  }

  return bibstart + entries.join('') + bibend
}
