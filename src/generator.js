/**
 * @typedef {import('hast').Node} Node
 * @typedef {import('hast').Parent} Parent
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Element} Element
 * @typedef {import('unist-util-visit').Visitor<Node>} Visitor
 * @typedef {import('./parse-citation').CiteItem} CiteItem
 * @typedef {"note" | "in-text"} Mode
 * @typedef Options
 *   Configuration.
 * @property {string} [bibliography]
 *   Name of bibtex or CSL-JSON file
 * @property {string} [path]
 *   Optional path to file (node). Will be joined with `options.bibliography` and used in place of cwd of file if provided.
 * @property {'apa'|'vancouver'|'harvard1'|'chicago'|'mla'|string} [csl]
 *   One of 'apa', 'vancouver', 'harvard1', 'chicago', 'mla'. A local file path or URL to a valid CSL file is also accepted.
 * @property {string} [lang]
 *   Locale to use in formatting citations. Defaults to en-US. A local file path or URL to a valid locale file is also accepted.
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
import { isNode, isValidHttpUrl, readFile, getBibliography, loadCSL, loadLocale } from './utils.js'
import { htmlToHast } from './html-transform-node.js'

const defaultCiteFormat = 'apa'
const permittedTags = ['div', 'p', 'span', 'li']
const idRoot = 'CITATION'

/**
 * Generate citation using citeproc
 * This accounts for prev citations and additional properties
 *
 * @param {*} citeproc
 * @param {Mode} mode
 * @param {CiteItem[]} entries
 * @param {number} citationId
 * @param {any[]} citationPre
 * @param {Options} options
 * @param {boolean} isComposite
 * @return {[string, string]}
 */
const genCitation = (citeproc, mode, entries, citationId, citationPre, options, isComposite) => {
  const key = `${idRoot}-${citationId}`
  const c = citeproc.processCitationCluster(
    {
      citationID: key,
      citationItems: entries,
      properties:
        mode === 'in-text'
          ? { noteIndex: 0, mode: isComposite ? 'composite' : '' }
          : { noteIndex: citationId, mode: isComposite ? 'composite' : '' },
    },
    citationPre.length > 0 ? citationPre : [],
    []
  )

  // console.log(Object.getOwnPropertyNames(citeproc.registry))
  // console.log(citeproc.registry.citationreg.citationByIndex)
  // c = [ { bibchange: true, citation_errors: [] }, [ [ 0, '(1)', 'CITATION-1' ] ]]
  const citationText = c[1].find((x) => x[2] === key)[1]
  const ids = `citation--${entries.map((x) => x.id.toLowerCase()).join('--')}--${citationId}`
  if (mode === 'note') {
    // Use cite-fn-{id} to denote footnote from citation, will clean it up later to follow gfm "user-content" format
    return [
      citationText,
      htmlToHast(
        `<span class="${(options.inlineClass ?? []).join(
          ' '
        )}" id=${ids}><sup><a href="#cite-fn-${citationId}" id="cite-fnref-${citationId}" data-footnote-ref aria-describedby="footnote-label">${citationId}</a></sup></span>`
      ),
    ]
  }
  // Coerce to html to parse HTML code e.g. &#38; and return text node
  return [
    citationText,
    htmlToHast(
      `<span class="${(options.inlineClass ?? []).join(' ')}" id=${ids}>${citationText}</span>`
    ),
  ]
}

{
  /* <section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>First note <a href="#user-content-fnref-1" data-footnote-backref class="data-footnote-backref" aria-label="Back to content">↩</a></p>
</li>
</ol>
</section> */
}

/**
 * Create new footnote section node based on footnoteArray mappings
 *
 * @param {{int: string}} citationDict
 * @param {{type: 'citation' | 'existing', oldId: number}[]} footnoteArray
 * @param {Element | undefined} footnoteSection
 * @return {Element}
 */
const genFootnoteSection = (citationDict, footnoteArray, footnoteSection) => {
  /** @type {Element} */
  const list = {
    type: 'element',
    tagName: 'ol',
    children: [{ type: 'text', value: '\n' }],
  }
  let oldFootnoteList
  if (footnoteSection) {
    oldFootnoteList = footnoteSection.children.find((n) => n.tagName === 'ol')
  }
  for (const [idx, item] of footnoteArray.entries()) {
    const { type, oldId } = item
    if (type === 'citation') {
      list.children.push({
        type: 'element',
        tagName: 'li',
        properties: { id: `user-content-fn-${idx + 1}` },
        children: [
          {
            type: 'element',
            tagName: 'p',
            properties: {},
            children: [
              {
                type: 'text',
                value: citationDict[oldId],
              },
              {
                type: 'element',
                tagName: 'a',
                properties: {
                  href: `#user-content-fnref-${idx + 1}`,
                  dataFootnoteBackref: true,
                  className: ['data-footnote-backref'],
                  ariaLabel: 'Back to content',
                },
                children: [{ type: 'text', value: '↩' }],
              },
            ],
          },
          { type: 'text', value: '\n' },
        ],
      })
    } else if (type === 'existing') {
      // @ts-ignore
      const liNode = oldFootnoteList.children.find(
        (n) => n.tagName === 'li' && n.properties.id === `user-content-fn-${oldId}`
      )
      liNode.properties.id = `user-content-fn-${idx + 1}`
      const aNode = liNode.children[1].children.find((n) => n.tagName === 'a')
      aNode.properties.href = `#user-content-fnref-${idx + 1}`
      list.children.push(liNode)
    }
  }

  /** @type {Element} */
  const newfootnoteSection = {
    type: 'element',
    tagName: 'section',
    properties: { dataFootnotes: true, className: ['footnotes'] },
    children: [
      {
        type: 'element',
        tagName: 'h2',
        properties: { className: ['sr-only'], id: 'footnote-label' },
        children: [{ type: 'text', value: 'Footnotes' }],
      },
      { type: 'text', value: '\n' },
      list,
    ],
  }
  return newfootnoteSection
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
  biblioNode.children
    .filter((node) => node.properties?.className?.includes('csl-entry'))
    .forEach((node, i) => {
      const citekey = params.entry_ids[i][0].toLowerCase()
      node.properties = node.properties || {}
      node.properties.id = 'bib-' + citekey
    })
  return biblioNode
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

        const [entries, isComposite] = parseCitation(match[0])

        // If id is not in citation file (e.g. route alias or js package), abort process
        for (const citeItem of entries) {
          if (!citationIds.includes(citeItem.id)) return
        }
        const [citedText, citedTextNode] = genCitation(
          citeproc,
          mode,
          entries,
          citationId,
          citationPre,
          options,
          isComposite
        )
        citationDict[citationId] = citedText

        // Prepare citationPre and citationId for the next cite instance
        citationPre.push([`${idRoot}-${citationId}`, 0])
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

      // Need to adjust footnote numbering based on existing ones already assigned
      // And insert them into the footnote section (if exists)
      if (mode === 'note' && Object.keys(citationDict).length > 0) {
        let footnoteSection
        visit(tree, 'element', (node) => {
          if (node.tagName === 'section' && node.properties.dataFootnotes) {
            footnoteSection = node
          }
        })
        /** @type {{type: 'citation' | 'existing', oldId: number}[]} */
        let fnArray = []
        let index = 1
        visit(tree, 'element', (node) => {
          if (node.tagName === 'sup') {
            let nextNode = node.children[0]
            if (nextNode.tagName === 'a') {
              // @ts-ignore
              const { href, id } = nextNode.properties
              if (href.includes('fn') && id.includes('fnref')) {
                const oldId = href.split('-').pop()
                fnArray.push({
                  type: href.includes('cite') ? 'citation' : 'existing',
                  oldId,
                })
                // Update ref number
                // @ts-ignore
                nextNode.properties.href = `#user-content-fn-${index}`
                // @ts-ignore
                nextNode.properties.id = `user-content-fnref-${index}`
                nextNode.children[0].value = index.toString()
                index += 1
              }
            }
          }
        })
        // @ts-ignore
        const newFootnoteSection = genFootnoteSection(citationDict, fnArray, footnoteSection)
        if (footnoteSection) {
          // Insert in place
          visit(tree, 'element', (node) => {
            if (node.tagName === 'section' && node.properties.dataFootnotes) {
              node.children = newFootnoteSection.children
            }
          })
        } else {
          tree.children.push(newFootnoteSection)
        }
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
