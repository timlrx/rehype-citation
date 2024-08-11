const getAttributedEntry = (string, name, value) =>
  string.replace(/^\s*<[a-z]+/i, `$& data-${name}="${value}"`)
const getPrefixedEntry = (value, id) => getAttributedEntry(value, 'csl-entry-id', id)
export { getAttributedEntry, getPrefixedEntry }
