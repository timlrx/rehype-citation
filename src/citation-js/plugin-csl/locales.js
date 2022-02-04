import { util } from '../core/index.js'
import defaultLocales from './locales.json'
const locales = new util.Register(defaultLocales)

const fetchLocale = (lang) => {
  if (locales.has(lang)) {
    return locales.get(lang)
  } else {
    return locales.get('en-US')
  }
}

export default fetchLocale
export { locales }
