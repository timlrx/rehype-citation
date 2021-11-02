/**
 * @typedef {import('hast').Node} Node
 * @typedef {import('hast').Parent} Parent
 * @typedef {import('hast').Root} Root
 * @typedef {import('unist-util-visit').Visitor<Node>} Visitor
 * @typedef {import('./parse-citation').CiteItem} CiteItem
 * @typedef Options
 *   Configuration.
 * @property {string} [bibliography]
 *   Name of bibtex or CSL-JSON file
 * @property {string} [path]
 *   Required, path to file. Will be joined with `options.bibliography` and `options.csl`, if provided.
 * @property {'apa'|'vancouver'|'harvard1'|'chicago'|'mla'|string} [csl]
 *   One of 'apa', 'vancouver', 'harvard1', 'chicago', 'mla' or name of the local csl file
 * @property {string} [lang]
 *   Locale to use in formatting citations. Defaults to en.
 * @property {boolean} [suppressBibliography]
 *   By default, biliography is inserted after the entire markdown file.
 *   If the file contains `[^Ref]`, the biliography will be inserted there instead.
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
import { parseCitation } from './parse-citation.js'
import { citeExtractorRe } from './regex.js'
import mla from './csl/mla.js'
import chicago from './csl/chicago.js'

const defaultPath = process.cwd()

// Citation.js comes with apa, harvard1 and vancouver
const config = plugins.config.get('@csl')
config.templates.add('mla', mla)
config.templates.add('chicago', chicago)

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
 * @param {CiteItem[]} entries
 * @param {string} citationId
 * @param {any[]} citationPre
 * @param {*} [properties={ noteIndex: 0 }]
 * @return {*}
 */
const genCitation = (citeproc, entries, citationId, citationPre, properties = { noteIndex: 0 }) => {
  const c = citeproc.processCitationCluster(
    {
      citationID: citationId,
      citationItems: entries,
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
 * Rehype plugin that formats citations in markdown documents and insert bibliography in html format
 *
 *    [-@wadler1990]                              --> (1990)
 *    [@hughes1989, sec 3.4]                      --> (Hughes 1989, sec 3.4)
 *    [see @wadler1990; and @hughes1989, pp. 4]   --> (see Wadler 1990 and Hughes 1989, pp. 4)
 * @type {import('unified').Plugin<[Options?], Root>}
 */
const rehypeCitation = (options = {}) => {
  return (tree) => {
    if (!options.bibliography) return

    const bibtexFile = fs.readFileSync(
      path.join(options.path || defaultPath, options.bibliography),
      'utf8'
    )
    citeFormat = 'apa'

    if (options.csl) {
      customCslConfig(path.join(options.path || defaultPath, options.csl), options.csl)
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

      const [properties, entries] = parseCitation(match[0])

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
          parent.children[idx] = biblioNode
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
