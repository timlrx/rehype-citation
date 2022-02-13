import parse5 from 'parse5'
import { fromParse5 } from 'hast-util-from-parse5'

/**
 * Convert HTML to HAST node
 *
 * @param {string} html
 */
export const htmlToHast = (html) => {
  const p5ast = parse5.parseFragment(html)
  return fromParse5(p5ast).children[0]
}
