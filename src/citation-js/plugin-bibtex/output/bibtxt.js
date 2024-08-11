function formatEntry({ type, label, properties }, dict) {
  const fields = Object.entries(properties)
    .concat([['type', type]])
    .map(([field, value]) => dict.listItem.join(`${field}: ${value}`))
  return dict.entry.join(`[${label}]${dict.list.join(fields.join(''))}`)
}
export function format(src, dict) {
  const entries = src.map((entry) => formatEntry(entry, dict)).join('\n')
  return dict.bibliographyContainer.join(entries)
}
