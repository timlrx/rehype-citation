function formatEntry({ type, label, properties }, dict) {
  const fields = Object.entries(properties).map(([field, value]) =>
    dict.listItem.join(`${field} = {${value}},`)
  )
  return dict.entry.join(`@${type}{${label},${dict.list.join(fields.join(''))}}`)
}

export function format(src, dict) {
  const entries = src.map((entry) => formatEntry(entry, dict)).join('')
  return dict.bibliographyContainer.join(entries)
}
