import { useState } from 'react'
import './index.css'
import Example from './Example'
import {
  defaultExample,
  SuppressBibliographyExample,
  CustomCSLExample,
  FootnotesExample,
} from './md-examples'

const bibliography =
  'https://raw.githubusercontent.com/timlrx/rehype-citation/main/test/references-data.bib'

const acmCSL =
  'https://raw.githubusercontent.com/citation-style-language/styles/master/acm-sig-proceedings.csl'

const chicagofullnoteCSL =
  'https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-fullnote-bibliography.csl'

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
