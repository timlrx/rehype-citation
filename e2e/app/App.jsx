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
      })
      .process(document.getElementById('citation').innerHTML)
      .then((file) => {
        document.getElementById('citation').innerHTML = file
      })
  }, [])
  return (
    <div id="citation">
      <div>[@Nash1950]</div>
    </div>
  )
}

export default App
