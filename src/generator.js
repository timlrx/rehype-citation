/**
 * @typedef {import('hast').Node} Node
 * @typedef {import('hast').Parent} Parent
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Element} Element
 * @typedef {import('unist-util-visit').Visitor<Node>} Visitor
 * @typedef {import('./types').CiteItem} CiteItem
 * @typedef {import('./types').Mode} Mode
 * @typedef {import('./types').Options} Options
 */

import { visit } from 'unist-util-visit'
import fetch from 'cross-fetch'
import { parseCitation } from './parse-citation.js'
import { genCitation } from './gen-citation.js'
import { genBiblioNode } from './gen-biblio.js'
import { genFootnoteSection } from './gen-footnote.js'
import { citationRE } from './regex.js'
import {
  isNode,
  isValidHttpUrl,
  readFile,
  getBibliography,
  loadCSL,
  loadLocale,
  getCitationFormat,
} from './utils.js'

const defaultCiteFormat = 'apa'
const permittedTags = ['div', 'p', 'span', 'li', 'td', 'th']
const idRoot = 'CITATION'

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
      const inputCiteformat = options.csl || file?.data?.frontmatter?.csl || defaultCiteFormat
      const inputLang = options.lang || 'en-US'
      const config = Cite.plugins.config.get('@csl')
      const citeFormat = await loadCSL(Cite, inputCiteformat, options.path)
      const lang = await loadLocale(Cite, inputLang, options.path)

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
      const citationDict = {}
      let citationId = 1
      const citeproc = config.engine(citations.data, citeFormat, lang, 'html')
      /** @type {Mode} */
      const mode = citeproc.opt.xclass
      const citationFormat = getCitationFormat(citeproc)

      visit(tree, 'text', (node, idx, parent) => {
        const match = node.value.match(citationRE)
        if (!match || ('tagName' in parent && !permittedTags.includes(parent.tagName))) return
        let citeStartIdx = match.index
        let citeEndIdx = match.index + match[0].length
        // If we have an in-text citation and we should suppress the author, the
        // match.index does NOT include the positive lookbehind, so we have to manually
        // shift "from" to one before.
        if (match[2] !== undefined) {
          citeStartIdx--
        }
        const newChildren = []
        // if preceding string
        if (citeStartIdx !== 0) {
          // create a new child node
          newChildren.push({
            type: 'text',
            value: node.value.slice(0, citeStartIdx),
          })
        }

        const [entries, isComposite] = parseCitation(match)

        // If id is not in citation file (e.g. route alias or js package), abort process
        for (const citeItem of entries) {
          if (!citationIds.includes(citeItem.id)) return
        }
        const [citedText, citedTextNode] = genCitation(
          citeproc,
          mode,
          entries,
          idRoot,
          citationId,
          citationPre,
          options,
          isComposite,
          citationFormat
        )
        citationDict[citationId] = citedText

        // Prepare citationPre and citationId for the next cite instance
        citationPre.push([`${idRoot}-${citationId}`, 0])
        citationId = citationId + 1

        newChildren.push(citedTextNode)

        // if trailing string
        if (citeEndIdx < node.value.length) {
          newChildren.push({
            type: 'text',
            value: node.value.slice(citeEndIdx),
          })
        }

        // insert into the parent
        // @ts-ignore
        parent.children = [
          ...parent.children.slice(0, idx),
          ...newChildren,
          ...parent.children.slice(idx + 1),
        ]
      })

      if (options.noCite) {
        citeproc.updateItems(options.noCite.map((x) => x.replace('@', '')))
      }

      if (
        citeproc.registry.mylist.length >= 1 &&
        (!options.suppressBibliography || options.inlineBibClass?.length > 0)
      ) {
        const biblioNode = genBiblioNode(citeproc)
        let bilioInserted = false

        const biblioMap = {}
        biblioNode.children
          .filter((node) => node.properties?.className?.includes('csl-entry'))
          .forEach((node) => {
            const citekey = node.properties.id.split('-').slice(1).join('-')
            biblioMap[citekey] = { ...node }
            biblioMap[citekey].properties = { id: 'inlinebib-' + citekey }
          })

        // Insert it at ^ref, if not found insert it as the last element of the tree
        visit(tree, 'element', (node, idx, parent) => {
          // Add inline bibliography
          if (
            options.inlineBibClass?.length > 0 &&
            node.properties?.id?.toString().startsWith('citation-')
          ) {
            // id is citation--nash1951--nash1950--1
            const [, ...citekeys] = node.properties.id.toString().split('--')
            const citationID = citekeys.pop()

            /** @type {Element} */
            const inlineBibNode = {
              type: 'element',
              tagName: 'div',
              properties: {
                className: options.inlineBibClass,
                id: `inlineBib--${citekeys.join('--')}--${citationID}`,
              },
              children: citekeys.map((citekey) => {
                const aBibNode = biblioMap[citekey]
                aBibNode.properties = {
                  class: 'inline-entry',
                  id: `inline--${citekey}--${citationID}`,
                }
                return aBibNode
              }),
            }
            parent.children.push(inlineBibNode)
          }

          // Add bibliography
          if (
            !options.suppressBibliography &&
            (node.tagName === 'p' || node.tagName === 'div') &&
            node.children.length >= 1 &&
            node.children[0].type === 'text' &&
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

      let footnoteSection
      visit(tree, 'element', (node, index, parent) => {
        if (node.tagName === 'section' && node.properties.dataFootnotes) {
          footnoteSection = node
          parent.children.splice(index, 1)
        }
      })

      // Need to adjust footnote numbering based on existing ones already assigned
      // And insert them into the footnote section (if exists)
      // Footnote comes after bibliography
      if (mode === 'note' && Object.keys(citationDict).length > 0) {
        /** @type {{type: 'citation' | 'existing', oldId: string}[]} */
        let fnArray = []
        let index = 1
        visit(tree, 'element', (node) => {
          if (node.tagName === 'sup' && node.children[0].type === 'element') {
            let nextNode = node.children[0]
            if (nextNode.tagName === 'a') {
              /** @type {{href: string, id: string}} */ // @ts-ignore
              const { href, id } = nextNode.properties
              if (href.includes('fn') && id.includes('fnref')) {
                const oldId = href.split('-').pop()
                fnArray.push({
                  type: href.includes('cite') ? 'citation' : 'existing',
                  oldId,
                })
                // Update ref number
                nextNode.properties.href = `#user-content-fn-${index}`
                nextNode.properties.id = `user-content-fnref-${index}`
                // @ts-ignore
                nextNode.children[0].value = index.toString()
                index += 1
              }
            }
          }
        })
        // @ts-ignore
        const newFootnoteSection = genFootnoteSection(citationDict, fnArray, footnoteSection)
        tree.children.push(newFootnoteSection)
      } else {
        if (footnoteSection) tree.children.push(footnoteSection)
      }
    }
  }
}

export default rehypeCitationGenerator
