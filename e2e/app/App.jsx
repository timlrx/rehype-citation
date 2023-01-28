import { useEffect } from 'react'
import { rehype } from 'rehype'
import rehypeCitation from '../../index.js'

function App() {
  useEffect(() => {
    rehype()
      .data('settings', { fragment: true })
      .use(rehypeCitation, {
        bibliography:
          'https://raw.githubusercontent.com/timlrx/rehype-citation/main/test/references-data.bib',
        suppressBibliography: true,
        csl: 'https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-fullnote-bibliography.csl',
      })
      .process('<div>abc [@Nash1950] cde</div>')
      .then((file) => {
        console.log(String(file))
      })
  }, [])
  return (
    <div id="citation">
      <div>The brown fox [@Nash1950] jumps over the lazy dog</div>
      <div></div>
    </div>
  )
}

export default App
