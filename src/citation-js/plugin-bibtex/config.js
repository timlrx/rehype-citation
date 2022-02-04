import biblatex from './mapping/biblatexTypes.json'
import bibtex from './mapping/bibtexTypes.json'
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
