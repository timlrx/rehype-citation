/**
 * @typedef {import('hast').Element} Element
 */

import { htmlToHast } from './html-transform-node.js'

/**
 * Create new footnote section node based on footnoteArray mappings
 *
 * @param {{int: string}} citationDict
 * @param {{type: 'citation' | 'existing', oldId: number}[]} footnoteArray
 * @param {Element | undefined} footnoteSection
 * @return {Element}
 */
export const genFootnoteSection = (citationDict, footnoteArray, footnoteSection) => {
  /** @type {Element} */
  const list = {
    type: 'element',
    tagName: 'ol',
    children: [{ type: 'text', value: '\n' }],
  }
  let oldFootnoteList
  if (footnoteSection) {
    // @ts-ignore
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
              htmlToHast(`<span>${citationDict[oldId]}</span>`),
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
