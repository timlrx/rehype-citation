import biblatex from './mapping/biblatexTypes.js'
import bibtex from './mapping/bibtexTypes.js'
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
    checkLabel: true,
    asciiOnly: true,
  },
  biber: {
    annotationMarker: '+an',
    namedAnnotationMarker: ':',
  },
}
