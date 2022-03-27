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
 *   Optional path to file (node). Will be joined with `options.bibliography` and used in place of cwd of file if provided.
 * @property {'apa'|'vancouver'|'harvard1'|'chicago'|'mla'|string} [csl]
 *   One of 'apa', 'vancouver', 'harvard1', 'chicago', 'mla' or name of the local csl file
 * @property {string} [lang]
 *   Locale to use in formatting citations. Defaults to en-US.
 * @property {boolean} [suppressBibliography]
 *   By default, biliography is inserted after the entire markdown file.
 *   If the file contains `[^Ref]`, the biliography will be inserted there instead.
 * @property {string[]} [noCite]
 *   Citation IDs (@item1) to include in the bibliography even if they are not cited in the document
 * @property {string[]} [inlineClass]
 *   Class(es) to add to the inline citation.
 * @property {string[]} [inlineBibClass]
 *   Class(es) to add to the inline bibliography. Leave empty for no inline bibliography.
 */

import { visit } from 'unist-util-visit'
import fetch from 'cross-fetch'
import { parseCitation } from './parse-citation.js'
import { citeExtractorRe } from './regex.js'
import { isNode, isValidHttpUrl, readFile, getBibliography } from './utils.js'
import { htmlToHast } from './html-transform-node.js'

const defaultCiteFormat = 'apa'
const permittedTags = ['div', 'p', 'span', 'li']

/**
 * Generate citation using citeproc
 * This accounts for prev citations and additional properties
 *
 * @param {*} citeproc
 * @param {CiteItem[]} entries
 * @param {string} citationId
 * @param {any[]} citationPre
 * @param {Options} options
 * @param {*} [properties={ noteIndex: 0 }]
 * @return {*}
 */
const genCitation = (
  citeproc,
  entries,
  citationId,
  citationPre,
  options,
  properties = { noteIndex: 0 }
) => {
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
  const idx = c[1].findIndex((x) => x[2] === citationId)
  // const result = c[1].filter((x) => x[2] === citationId
  // Coerce to html to parse HTML code e.g. &#38; and return text node
  return htmlToHast(
    `<span class="${(options.inlineClass ?? []).join(' ')}" id=${
      'citation-' + entries[idx].id.toLowerCase() + '-' + citationId.split('-')[1]
    }>${c[1][idx][1]}</span>`
  )
}

/**
 * Generate bibliography in html and convert it to hast
 *
 * @param {*} citeproc
 */
const genBiblioNode = (citeproc) => {
  const [params, bibBody] = citeproc.makeBibliography()
  const bibliography =
    '<div id="refs" class="references csl-bib-body">\n' + bibBody.join('') + '</div>'
  const biblioNode = htmlToHast(bibliography)

  // Add citekey id to each bibliography entry.
  const biblioEntries = {}
  biblioNode.children
    .filter((node) => node.properties?.className?.includes('csl-entry'))
    .forEach((node, i) => {
      const citekey = params.entry_ids[i][0].toLowerCase()

      node.properties = node.properties || {}
      node.properties.id = 'bib-' + citekey

      biblioEntries[citekey] = { ...node }
      biblioEntries[citekey].properties = { id: 'inlinebib-' + citekey }
    })
  return { biblioNode, biblioEntries }
}

/**
 * Rehype plugin that formats citations in markdown documents and insert bibliography in html format
 *
 *    [-@wadler1990]                              --> (1990)
 *    [@hughes1989, sec 3.4]                      --> (Hughes 1989, sec 3.4)
 *    [see @wadler1990; and @hughes1989, pp. 4]   --> (see Wadler 1990 and Hughes 1989, pp. 4)
 *
 * @param {*} Cite cite object from citation-js configured with the required CSLs
 * @return {import('unified').Plugin<[Options?], Root>}
 */
const rehypeCitationGenerator = (Cite) => {
  return (options = {}) => {
    return async (tree, file) => {
      let bibliography = await getBibliography(options, file)
      if (!bibliography) {
        return
      }

      /** @type {string} */
      let bibtexFile
      /** @type {string} */ // @ts-ignore
      const citeFormat = options.csl || file?.data?.frontmatter?.csl || defaultCiteFormat
      if (isValidHttpUrl(bibliography)) {
        isNode
        const response = await fetch(bibliography)
        bibtexFile = await response.text()
      } else {
        if (isNode) {
          bibtexFile = await readFile(bibliography)
        } else {
          throw new Error(`Cannot read non valid bibliography URL in node env.`)
        }
      }

      const citations = new Cite(bibtexFile)
      const citationIds = citations.data.map((x) => x.id)
      const citationPre = []
      let citationId = 1
      const config = Cite.plugins.config.get('@csl')
      const citeproc = config.engine(citations.data, citeFormat, options.lang || 'en-US', 'html')
      visit(tree, 'text', (node, idx, parent) => {
        const match = node.value.match(citeExtractorRe)
        //@ts-ignore
        if (!match || !permittedTags.includes(parent.tagName)) return
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

        // If id is not in citation file (e.g. route alias or js package), abort process
        for (const citeItem of entries) {
          if (!citationIds.includes(citeItem.id)) return
        }
        const citedTextNode = genCitation(
          citeproc,
          entries,
          `CITATION-${citationId}`,
          citationPre,
          options,
          properties
        )

        // Prepare citationPre and citationId for the next cite instance
        citationPre.push([`CITATION-${citationId}`, 0])
        citationId = citationId + 1

        // TODO: return html with link
        newChildren.push(citedTextNode)

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
        citeproc.updateItems(options.noCite.map((x) => x.replace('@', '')))
      }

      if (citeproc.registry.mylist.length >= 1) {
        const { biblioNode, biblioEntries } = genBiblioNode(citeproc)
        let bilioInserted = false

        // Insert it at ^ref, if not found insert it as the last element of the tree
        visit(tree, 'element', (node, idx, parent) => {
          // Add inline bibliography
          if (
            options.inlineBibClass?.length > 0 &&
            node.properties?.id?.toString().startsWith('citation-')
          ) {
            const citekey = node.properties.id.toString().split('-').slice(1, -1).join('-')
            biblioEntries[citekey].properties.className = options.inlineBibClass
            parent.children.push(biblioEntries[citekey])
          }

          // Add bibliography
          if (
            !options.suppressBibliography &&
            (node.tagName === 'p' || node.tagName === 'div') &&
            node.children[0].value === '[^ref]'
          ) {
            parent.children[idx] = biblioNode
            bilioInserted = true
          }
        })

        if (!options.suppressBibliography && !bilioInserted) {
          tree.children.push(biblioNode)
        }
      }
    }
  }
}

export default rehypeCitationGenerator
