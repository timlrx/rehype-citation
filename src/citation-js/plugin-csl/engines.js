import CSL from 'citeproc'
import { templates } from './styles.js'
import { locales } from './locales.js'
const proxied = Symbol.for('proxied')

const getWrapperProxy = function (original) {
  const proxy = function (state, entry) {
    if (state.sys.wrapBibliographyEntry) {
      const [prefix, postfix] = state.sys.wrapBibliographyEntry(this.system_id)
      entry = [prefix, entry, postfix].join('')
    }

    return original.call(this, state, entry)
  }

  proxy[proxied] = true
  return proxy
}

for (const format in CSL.Output.Formats) {
  const original = CSL.Output.Formats[format]['@bibliography/entry']

  if (!original || original[proxied]) {
    continue
  }

  CSL.Output.Formats[format]['@bibliography/entry'] = getWrapperProxy(original)
}

function retrieveLocale(lang) {
  const unnormalised = lang.replace('-', '_')

  if (locales.has(lang)) {
    return locales.get(lang)
  } else if (locales.has(unnormalised)) {
    return locales.get(unnormalised)
  }
}

const engines = {}

const fetchEngine = function (style, lang, template, retrieveItem, retrieveLocale) {
  const engineHash = `${style}|${lang}`
  let engine

  if (engines[engineHash] instanceof CSL.Engine) {
    engine = engines[engineHash]
    engine.sys.retrieveItem = retrieveItem
    engine.updateItems([])
  } else {
    engine = engines[engineHash] = new CSL.Engine(
      {
        retrieveLocale,
        retrieveItem,
      },
      template,
      lang,
      true
    )
  }

  return engine
}

const prepareEngine = function (data, templateName, language, format) {
  if (!CSL.Output.Formats[format] || !CSL.Output.Formats[format]['@bibliography/entry']) {
    throw new TypeError(`Cannot find format '${format}'`)
  }

  const items = data.reduce((store, entry) => {
    store[entry.id] = entry
    return store
  }, {})
  const template = templates.get(templates.has(templateName) ? templateName : 'apa')
  language = locales.has(language) ? language : 'en-US'

  const callback = function (key) {
    if (Object.prototype.hasOwnProperty.call(items, key)) {
      return items[key]
    } else {
      throw new Error(`Cannot find entry with id '${key}'`)
    }
  }

  const engine = fetchEngine(templateName, language, template, callback, retrieveLocale)
  engine.setOutputFormat(format)
  return engine
}

export default prepareEngine
export { fetchEngine }
