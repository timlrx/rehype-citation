import rehypeCitationGenerator from './generator.js'
// @ts-ignore
import Cite from './cite.js'
import mla from '../styles/mla.js'
import chicago from '../styles/chicago.js'
import harvard1 from '../styles/harvard1.js'
import vancouver from '../styles/vancouver.js'

const config = Cite.plugins.config.get('@csl')

// Citation.js comes with apa
config.templates.add('vancouver', vancouver)
config.templates.add('harvard1', harvard1)
config.templates.add('mla', mla)
config.templates.add('chicago', chicago)

const rehypeCitation = rehypeCitationGenerator(Cite)

export default rehypeCitation
