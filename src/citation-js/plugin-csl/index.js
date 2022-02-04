import { plugins } from '../core/index.js'
import { locales } from './locales.js'
import { templates } from './styles.js'
import engine from './engines.js'
import bibliography from './bibliography.js'
import citation from './citation.js'
plugins.add('@csl', {
  output: {
    bibliography,
    citation,
  },
  config: {
    engine,
    locales,
    templates,
  },
})
