import Register from '../util/register.js'
function validate(name, dict) {
  if (typeof name !== 'string') {
    throw new TypeError(`Invalid dict name, expected string, got ${typeof name}`)
  } else if (typeof dict !== 'object') {
    throw new TypeError(`Invalid dict, expected object, got ${typeof dict}`)
  }
  for (const entryName in dict) {
    const entry = dict[entryName]
    if (!Array.isArray(entry) || entry.some((part) => typeof part !== 'string')) {
      throw new TypeError(`Invalid dict entry "${entryName}", expected array of strings`)
    }
  }
}
export const register = new Register({
  html: {
    bibliographyContainer: ['<div class="csl-bib-body">', '</div>'],
    entry: ['<div class="csl-entry">', '</div>'],
    list: ['<ul style="list-style-type:none">', '</ul>'],
    listItem: ['<li>', '</li>'],
  },
  text: {
    bibliographyContainer: ['', '\n'],
    entry: ['', '\n'],
    list: ['\n', ''],
    listItem: ['\t', '\n'],
  },
})
export function add(name, dict) {
  validate(name, dict)
  register.set(name, dict)
}
export function remove(name) {
  register.remove(name)
}
export function has(name) {
  return register.has(name)
}
export function list() {
  return register.list()
}
export function get(name) {
  if (!register.has(name)) {
    throw new Error(`Dict "${name}" unavailable`)
  }
  return register.get(name)
}
export const htmlDict = {
  wr_start: '<div class="csl-bib-body">',
  wr_end: '</div>',
  en_start: '<div class="csl-entry">',
  en_end: '</div>',
  ul_start: '<ul style="list-style-type:none">',
  ul_end: '</ul>',
  li_start: '<li>',
  li_end: '</li>',
}
export const textDict = {
  wr_start: '',
  wr_end: '\n',
  en_start: '',
  en_end: '\n',
  ul_start: '\n',
  ul_end: '',
  li_start: '\t',
  li_end: '\n',
}
