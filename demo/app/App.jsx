import { useState } from 'react'
import './index.css'
import Example from './Example'

const bibliography =
  'https://raw.githubusercontent.com/timlrx/rehype-citation/main/test/references-data.bib'

const acmCSL =
  'https://raw.githubusercontent.com/citation-style-language/styles/master/acm-sig-proceedings.csl'

const chicagofullnoteCSL =
  'https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-fullnote-bibliography.csl'

const defaultExample = `## Welcome

Rehype plugin to nicely format citations in markdown
documents and insert bibliography in html format.

Supports standard citations [@Nash1950], in-text citations [@Nash1951]
and multiple citations [see @Nash1950 pp 12-13; @Nash1951]

Customizable CSL and locale.

### Bibliography
`

const SuppressBibliographyExample = `## Welcome

Rehype plugin to nicely format citations in markdown
documents and insert bibliography in html format.

Supports standard citations [@Nash1950], in-text citations [@Nash1951]
and multiple citations [see @Nash1950 pp 12-13; @Nash1951]

Customizable CSL and locale.
`

const CustomCSLExample = `## Welcome

Choose from one of the multiple preconfigured CSLs[^1]
[^1]: apa, vancouver, harvard1, chicago, mla

or pass in a valid file path or url to the _csl_ argument.

Here's an example in ACM format:

Supports standard citations [@Nash1950], in-text citations [@Nash1951]
and multiple citations [@Nash1950; @Nash1951]

### References
`

const FootnotesExample = `## Welcome

The plugin also works with Github formatted footnotes
from remarkgfm and automatically merges user content with citations.[^1]

[^1]: There's no guarantee it works with other footnote formats since
it searches for specific ids and hrefs added by GFM

Here's an example in Chicago fullnote style:

Supports standard citations [@Nash1950], in-text citations [@Nash1951]
and multiple citations [@Nash1950; @Nash1951]

### References
`

const examples = ['Default', 'Suppress Bibliography', 'Custom CSL', 'Footnote Style']

function App() {
  const [selected, setSelected] = useState(examples[0])
  return (
    <>
      <body className="mx-6 pt-12 lg:pl-12 mb-12">
        <h1 className="text-4xl font-bold">Rehype Citation</h1>
        <div className="mt-8 space-x-4 space-y-2">
          {examples.map((x) => (
            <button
              onClick={() => setSelected(x)}
              className={`${
                selected === x && 'bg-gradient-to-r from-purple-400 to-yellow-400'
              } px-4 py-2 text-sm font-bold bg-indigo-100 rounded`}
            >
              {x}
            </button>
          ))}
        </div>
        {selected === examples[0] && (
          <Example markdown={defaultExample} rehypeCitationOptions={{ bibliography }} />
        )}
        {selected === examples[1] && (
          <Example
            markdown={SuppressBibliographyExample}
            rehypeCitationOptions={{ bibliography, suppressBibliography: true }}
          />
        )}
        {selected === examples[2] && (
          <Example
            markdown={CustomCSLExample}
            rehypeCitationOptions={{
              bibliography,
              csl: acmCSL,
            }}
          />
        )}
        {selected === examples[3] && (
          <Example
            markdown={FootnotesExample}
            rehypeCitationOptions={{
              bibliography,
              csl: chicagofullnoteCSL,
            }}
          />
        )}
      </body>
    </>
  )
}

export default App
