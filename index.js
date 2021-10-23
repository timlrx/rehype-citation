/**
 * @typedef {import('hast').Node} Node
 * @typedef {import('hast').Parent} Parent
 * @typedef {import('hast').Root} Root
 * @typedef {import('unist-util-visit').Visitor<Node>} Visitor
 * @typedef Options options
 *   Configuration.
 * @property {string} [bibliography]
 *   Name of bibtex file
 * @property {'apa'|'vancouver'|'harvard1'|'chicago'|'mla'|string} [csl]
 *   One of 'apa', 'vancouver', 'harvard1', 'chicago', 'mla' or name of local csl file
 * @property {string} [path]
 *   Path to file
 * @property {string} [lang]
 *   Locale to use in formatting citations. Defaults to en.
 * @property {boolean} [suppressBibliography]
 *   Suppress bibliography?
 * @property {string[]} [noCite]
 *   Citation IDs (@item1) to include in the bibliography even if they are not cited in the document
 */

import { visit } from 'unist-util-visit'
import fs from 'fs'
import path from 'path'
import { plugins } from '@citation-js/core'
import Cite from 'citation-js'
import parse5 from 'parse5'
import { fromParse5 } from 'hast-util-from-parse5'
import mla from './csl/mla.js'
import chicago from './csl/chicago.js'

// Citation.js comes with apa, harvard1 and vancouver
const config = plugins.config.get('@csl')
config.templates.add('mla', mla)
config.templates.add('chicago', chicago)

/**
 * Captures normal citation in square bracket and in-text citation
 * Citation key start should start with a letter, digit, or _,
 * and contains only alphanumerics and single internal punctuation characters (:.#$%&-+?<>~/),
 *
 * e.g. [-@wadler1990], [@hughes1989, sec 3.4], [see @wadler1990; and @hughes1989, pp. 4]
 * and @wadler1990
 *
 * Group #1 - citation term without [] bracket e.g. -@wadler1990
 * Group #2 - in-text citation term e.g. @wadler1990
 *
 * \[([^[\]]*@[^[\]]+)\] for group #1
 * (?!\b)@([a-zA-Z0-9_][a-zA-Z0-9_:.#$%&\-+?<>~]*) for group #2
 * Use (?!\b) to avoid email like address e.g. xyx@google.com
 * */
const citeExtractorRe = /\[([^[\]]*@[^[\]]+)\]|(?!\b)(@[a-zA-Z0-9_][a-zA-Z0-9_:.#$%&\-+?<>~]*)/
const citeKeyRe = /@([a-zA-Z0-9_][a-zA-Z0-9_:.#$%&\-+?<>~]*)/g
const citeBracketRe = /\[.*\]/

const defaultCsl = ['apa', 'vancouver', 'harvard1', 'chicago', 'mla']
let citeFormat = 'apa'

const customCslConfig = (path, csl) => {
  if (defaultCsl.includes(csl)) {
    citeFormat = csl
  } else if (fs.existsSync(path)) {
    config.templates.add('mla', fs.readFileSync(path, 'utf8'))
  } else {
    throw new Error('Invalid csl name or path')
  }
}

/**
 * Generate citation using citeproc
 * This accounts for prev citations and additional properties
 *
 * @param {*} citeproc
 * @param {*} entries
 * @param {string} citationId
 * @param {any[]} citationPre
 * @param {*} [properties={ noteIndex: 0 }]
 * @return {*}
 */
const genCitation = (citeproc, entries, citationId, citationPre, properties = { noteIndex: 0 }) => {
  const c = citeproc.processCitationCluster(
    {
      citationID: citationId,
      citationItems: entries.map((id) => ({ id })),
      properties: properties,
    },
    citationPre.length > 0 ? citationPre : [],
    []
  )
  // c = [ { bibchange: true, citation_errors: [] }, [ [ 0, '(1)', 'CITATION-1' ] ]]
  const result = c[1].filter((x) => x[2] === citationId)
  return result[0][1]
}

/**
 * Generate bibliography in html and convert it to hast
 *
 * @param {*} citeproc
 */
const genBiblioNode = (citeproc) => {
  const [, bibBody] = citeproc.makeBibliography()
  const bibliography =
    '<div id="refs" class="references csl-bib-body">\n' + bibBody.join('') + '</div>'
  const p5ast = parse5.parseFragment(bibliography)
  const biblioNode = fromParse5(p5ast).children[0]
  return biblioNode
}

/**
 * Rehype plugin that highlights code blocks with refractor (prismjs)
 *
 *    [@wadler1990:comprehending-monads]          --> (Wadler 1990)
 *    [-@wadler1990]                              --> (1990)
 *    [@hughes1989, sec 3.4]                      --> (Hughes 1989, sec 3.4)
 *    [see @wadler1990; and @hughes1989, pp. 4]   --> (see Wadler 1990 and Hughes 1989, pp. 4)
 * @type {import('unified').Plugin<[Options?], Root>}
 */
const rehypeCitation = (options = {}) => {
  return (tree) => {
    if (!options.bibliography) return

    const bibtexFile = fs.readFileSync(path.join(options.path, options.bibliography), 'utf8')
    citeFormat = 'apa'

    if (options.csl) {
      customCslConfig(path.join(options.path, options.csl), options.csl)
    }

    const citations = new Cite(bibtexFile)
    const uniqueCiteRefs = []
    const citationPre = []
    let citationId = 1
    const citeproc = config.engine(citations.data, citeFormat, options.lang || 'en', 'html')

    visit(tree, 'text', (node, idx, parent) => {
      const match = node.value.match(citeExtractorRe)
      if (!match) return
      const citeStartIdx = match.index
      const citeEndIdx = match.index + match[0].length
      const newChildren = []
      // if preceding string
      if (citeStartIdx !== 0) {
        // create a new child node
        newChildren.push({
          type: 'text',
          value: node.value.slice(0, citeStartIdx),
        })
      }

      let citeMatch = [...match[0].matchAll(citeKeyRe)]
      for (let citeRef of citeMatch) {
        // Cite key in 1st capture group
        const citeKey = citeRef[1]
        // label depends if new or not
        if (!uniqueCiteRefs.includes(citeKey)) {
          uniqueCiteRefs.push(citeKey)
        }
      }

      const entries = citeMatch.map((x) => x[1])

      let properties
      // @ts-ignore
      if (citeBracketRe.test(match)) {
        properties = { noteIndex: 0 }
      } else {
        properties = { noteIndex: 0, mode: 'composite' }
      }

      const citedText = genCitation(
        citeproc,
        entries,
        `CITATION-${citationId}`,
        citationPre,
        properties
      )

      // Prepare citationPre and citationId for the next cite instance
      citationPre.push([`CITATION-${citationId}`, 0])
      citationId = citationId + 1

      // TODO: return html with link
      newChildren.push({
        type: 'text',
        value: citedText,
      })

      // if trailing string
      if (citeEndIdx < node.value.length) {
        newChildren.push({
          type: 'text',
          value: node.value.slice(citeEndIdx),
        })
      }

      // insert into the parent
      parent.children = [
        ...parent.children.slice(0, idx),
        ...newChildren,
        ...parent.children.slice(idx + 1),
      ]
    })

    if (options.noCite) {
      for (const item of options.noCite) {
        const citeKey = item.replace('@', '')
        if (!uniqueCiteRefs.includes(citeKey)) {
          uniqueCiteRefs.push(citeKey)
        }
      }
      citeproc.updateItems(uniqueCiteRefs)
    }

    if (!options.suppressBibliography) {
      const biblioNode = genBiblioNode(citeproc)
      let bilioInserted = false

      // Insert it at ^Ref, if not found insert it as the last element of the tree
      visit(tree, 'element', (node, idx, parent) => {
        if (
          (node.tagName === 'p' || node.tagName === 'div') &&
          node.children[0].value === '[^Ref]'
        ) {
          parent.children = [
            ...parent.children.slice(0, idx),
            biblioNode,
            ...parent.children.slice(idx + 1),
          ]
          bilioInserted = true
        }
      })

      if (!bilioInserted) {
        tree.children.push(biblioNode)
      }
    }
  }
}

export default rehypeCitation
