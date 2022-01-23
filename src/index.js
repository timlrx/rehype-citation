import rehypeCitationGenerator from './generator.js'
import Cite from 'citation-js'
import mla from '../csl/mla.js'
import chicago from '../csl/chicago.js'

// Citation.js comes with apa, harvard1 and vancouver
const config = Cite.plugins.config.get('@csl')
config.templates.add('mla', mla)
config.templates.add('chicago', chicago)

const rehypeCitation = rehypeCitationGenerator(Cite, config)

export default rehypeCitation
