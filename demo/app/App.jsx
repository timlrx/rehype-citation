import { useState, useEffect } from 'react'
import './index.css'
import Example from './Example'
import {
  defaultExample,
  SuppressBibliographyExample,
  CustomCSLExample,
  FootnotesExample,
  LinkCitationsExample,
  CFFExample,
} from './md-examples'

const bibliography =
  'https://raw.githubusercontent.com/timlrx/rehype-citation/main/test/references-data.bib'

const acmCSL =
  'https://raw.githubusercontent.com/citation-style-language/styles/master/acm-sig-proceedings.csl'

const chicagofullnoteCSL =
  'https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-fullnote-bibliography.csl'

const cff = 'https://raw.githubusercontent.com/timlrx/rehype-citation/main/test/CITATION.cff'
const cff2 = 'https://raw.githubusercontent.com/tensorflow/tensorflow/master/CITATION.cff'
const cff3 = 'https://raw.githubusercontent.com/langchain-ai/langchain/master/CITATION.cff'

const examples = [
  'Default',
  'Suppress Bibliography',
  'Custom CSL',
  'Footnote Style',
  'Link Citations',
  'Citation File Format',
]
const pathList = examples.map((e) => e.toLocaleLowerCase().replace(' ', '-'))

function App() {
  useEffect(() => {
    const result = pathList.find((x) => x === window.location.pathname.slice(1))
    if (result) setSelected(examples[pathList.indexOf(result)])
    else setSelected(examples[0])
  }, [])

  const [selected, setSelected] = useState()
  return (
    <>
      <div className="mx-6 pt-12 lg:pl-12 mb-12">
        <h1 className="text-4xl font-bold">Rehype Citation</h1>
        <div className="mt-8 space-x-4 space-y-2">
          {examples.map((x) => (
            <button
              key={x}
              onClick={() => {
                window.history.pushState({}, '', x.toLowerCase().replace(' ', '-'))
                setSelected(x)
              }}
              className={`${
                selected === x && 'bg-gradient-to-r from-purple-400 to-yellow-400'
              } px-4 py-2 text-sm font-bold bg-indigo-100 rounded`}
            >
              {x}
            </button>
          ))}
        </div>
        {selected === examples[0] && (
          <Example
            markdown={defaultExample}
            rehypeCitationOptions={{ bibliography: [bibliography, cff] }}
          />
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
        {selected === examples[4] && (
          <Example
            markdown={LinkCitationsExample}
            rehypeCitationOptions={{
              bibliography,
              linkCitations: true,
            }}
          />
        )}
        {selected === examples[5] && (
          <Example
            markdown={CFFExample}
            rehypeCitationOptions={{
              bibliography: [cff, cff2, cff3],
            }}
          />
        )}
      </div>
    </>
  )
}

export default App
