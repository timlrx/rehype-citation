import biblatex from './mapping/biblatexTypes'
import bibtex from './mapping/bibtexTypes'
import * as constants from './input/constants.js'
export default {
  constants,
  types: {
    biblatex,
    bibtex,
  },
  parse: {
    biblatex: true,
    strict: false,
    sentenceCase: 'never',
  },
  format: {
    useIdAsLabel: false,
  },
}
