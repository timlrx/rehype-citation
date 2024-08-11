const bibTxtRegex = {
  splitEntries: /\n\s*(?=\[)/g,
  parseEntry: /^\[(.+?)\]\s*(?:\n([\s\S]+))?$/,
  splitPairs: /((?=.)\s)*\n\s*/g,
  splitPair: /:(.*)/,
}
const parseBibTxtEntry = (entry) => {
  const [, label, pairs] = entry.match(bibTxtRegex.parseEntry) || []
  if (!label || !pairs) {
    return {}
  } else {
    const out = {
      type: 'book',
      label,
      properties: {},
    }
    pairs
      .trim()
      .split(bibTxtRegex.splitPairs)
      .filter((v) => v)
      .forEach((pair) => {
        let [key, value] = pair.split(bibTxtRegex.splitPair)
        if (value) {
          key = key.trim()
          value = value.trim()
          if (key === 'type') {
            out.type = value
          } else {
            out.properties[key] = value
          }
        }
      })
    return out
  }
}
const parseBibTxt = (src) => src.trim().split(bibTxtRegex.splitEntries).map(parseBibTxtEntry)
export { parseBibTxt as parse, parseBibTxt as text, parseBibTxtEntry as textEntry }
