/**
 * @typedef {import('./types').CiteItem} CiteItem
 * @typedef {import('./types').Mode} Mode
 * @typedef {import('./types').Options} Options
 */

import { getSortedRelevantRegistryItems, split, isSameAuthor } from './utils.js'
import { htmlToHast } from './html-transform-node.js'

/**
 * Generate citation using citeproc
 * This accounts for prev citations and additional properties
 *
 * @param {*} citeproc
 * @param {Mode} mode
 * @param {CiteItem[]} entries
 * @param {string} citationIdRoot
 * @param {number} citationId
 * @param {any[]} citationPre
 * @param {Options} options
 * @param {boolean} isComposite
 * @param {import('./types').CitationFormat} citationFormat
 * @return {[string, string]}
 */
export const genCitation = (
  citeproc,
  mode,
  entries,
  citationIdRoot,
  citationId,
  citationPre,
  options,
  isComposite,
  citationFormat
) => {
  const { inlineClass, linkCitations } = options
  const key = `${citationIdRoot}-${citationId}`
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
  // c = [ { bibchange: true, citation_errors: [] }, [ [ 0, '(1)', 'CITATION-1' ] ]]

  const citationText = c[1].find((x) => x[2] === key)[1]
  const ids = `citation--${entries.map((x) => x.id.toLowerCase()).join('--')}--${citationId}`
  if (mode === 'note') {
    // Use cite-fn-{id} to denote footnote from citation, will clean it up later to follow gfm "user-content" format
    return [
      citationText,
      htmlToHast(
        `<span class="${(inlineClass ?? []).join(
          ' '
        )}" id=${ids}><sup><a href="#cite-fn-${citationId}" id="cite-fnref-${citationId}" data-footnote-ref aria-describedby="footnote-label">${citationId}</a></sup></span>`
      ),
    ]
  } else if (linkCitations && citationFormat === 'numeric') {
    // e.g. [1, 2]
    let i = 0
    const refIds = entries.map((e) => e.id)
    const output = citationText.replace(/\d+/g, function (d) {
      const url = `<a href="#bib-${refIds[i].toLowerCase()}">${d}</a>`
      i++
      return url
    })

    return [
      citationText,
      htmlToHast(`<span class="${(inlineClass ?? []).join(' ')}" id=${ids}>${output}</span>`),
    ]
  } else if (linkCitations && citationFormat === 'author-date') {
    // E.g. (see Nash, 1950, pp. 12–13, 1951); (Nash, 1950; Xie, 2016)
    if (entries.length === 1) {
      // Do not link bracket
      const output = isComposite
        ? `<a href="#bib-${entries[0].id.toLowerCase()}">${citationText}</a>`
        : `${citationText.slice(0,1)}<a href="#bib-${entries[0].id.toLowerCase()}">${citationText.slice(1, -1)}</a>${citationText.slice(-1)}`
      return [
        citationText,
        htmlToHast(`<span class="${(inlineClass ?? []).join(' ')}" id=${ids}>${output}</span>`),
      ]
    } else {
      // Retrieve the items in the correct order and attach link each of them
      const refIds = entries.map((e) => e.id)
      const results = getSortedRelevantRegistryItems(citeproc, refIds, citeproc.opt.sort_citations)
      const output = []
      let str = citationText

      for (const [i, item] of results.entries()) {
        // Need to compare author. If same just match on date.
        const id = item.id
        let citeMatch = item.ambig
        // If author is the same as the previous, some styles like apa collapse the author
        if (i > 0 && isSameAuthor(results[i - 1], item) && str.indexOf(citeMatch) === -1) {
          // Just match on year
          citeMatch = item.ref.issued.year.toString()
        }
        const startPos = str.indexOf(citeMatch)
        const [start, rest] = split(str, startPos)
        output.push(start) // Irrelevant parts
        const url = `<a href="#bib-${id.toLowerCase()}">${rest.substring(0, citeMatch.length)}</a>`
        output.push(url)
        str = rest.substr(citeMatch.length)
      }
      output.push(str)
      return [
        citationText,
        htmlToHast(
          `<span class="${(inlineClass ?? []).join(' ')}" id=${ids}>${output.join('')}</span>`
        ),
      ]
    }
  } else {
    return [
      citationText,
      htmlToHast(`<span class="${(inlineClass ?? []).join(' ')}" id=${ids}>${citationText}</span>`),
    ]
  }
}
