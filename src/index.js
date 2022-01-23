import rehypeCitationGenerator from './generator.js'
// @ts-ignore
import Cite from './cite.cjs'
import mla from '../csl/mla.js'
import chicago from '../csl/chicago.js'

// Citation.js comes with apa, harvard1 and vancouver
const config = Cite.plugins.config.get('@csl')
config.templates.add('mla', mla)
config.templates.add('chicago', chicago)

const rehypeCitation = rehypeCitationGenerator(Cite)

export default rehypeCitation
