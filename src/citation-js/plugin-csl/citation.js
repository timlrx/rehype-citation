import prepareEngine from './engines.js'
export default function citation(data, options = {}) {
  const { template = 'apa', lang = 'en-US', format = 'text' } = options
  const ids = data.map(({ id }) => id)
  const entries = options.entry ? [].concat(options.entry) : ids
  const citeproc = prepareEngine(data, template, lang, format)
  citeproc.updateItems(ids)
  const { citationsPre = [], citationsPost = [] } = options
  const citation = citeproc.previewCitationCluster(
    {
      citationItems: entries.map((id) =>
        typeof id === 'object'
          ? id
          : {
              id,
            }
      ),
      properties: {
        noteIndex: 0,
      },
    },
    citationsPre,
    citationsPost,
    format
  )
  return citation
}
