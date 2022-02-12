import { fromDom } from 'hast-util-from-dom'

/**
 * Convert HTML to HAST node
 *
 * @param {string} html
 */
export const htmlToHast = (html) => {
  const frag = document.createRange().createContextualFragment(html)
  return fromDom(frag).children[0]
}
