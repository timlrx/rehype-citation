import { useEffect } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkGfm from 'remark-gfm'
import rehypeStringify from 'rehype-stringify'
import rehypeCitation from '../../index.js'

function Example({ markdown, rehypeCitationOptions }) {
  useEffect(() => {
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, {})
      .use(rehypeCitation, rehypeCitationOptions)
      .use(rehypeStringify)
      .process(markdown)
      .then((file) => {
        document.getElementById('results').innerHTML = file
      })
  }, [markdown, rehypeCitationOptions])

  return (
    <div>
      <div className="flex lg:space-x-12 flex-col lg:flex-row">
        <div className="mt-8 lg:max-w-[600px]">
          <h2 className="text-2xl mb-2">Markdown text</h2>
          <div
            className="pb-4 font-mono text-sm overflow-auto whitespace-pre bg-gray-800 text-white rounded p-4"
            id="markdown"
          >
            {markdown}
          </div>
          <h2 className="text-2xl mt-4 mb-2">Settings</h2>
          <div className="pb-4 bg-gray-200 whitespace-pre overflow-auto rounded p-4" id="markdown">
            {JSON.stringify(rehypeCitationOptions, null, 2)}
          </div>
        </div>
        <div className="mt-4 lg:mt-8">
          <h2 className="text-2xl mb-2">Result</h2>
          <div className="prose pb-4 marker:text-black bg-blue-100 rounded p-4" id="results">
            processing markdown...
          </div>
        </div>
      </div>
    </div>
  )
}

export default Example
