import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { rehype } from 'rehype'
import dedent from 'dedent'
import rehypeCitation from '../index.js'

const bibliography = './test/references-data.bib'

const processHtml = (html, options, input = bibliography) => {
  return rehype()
    .data('settings', { fragment: true })
    .use(rehypeCitation, { bibliography: input, ...options })
    .process(html)
    .then((file) => String(file))
}

const rehypeCitationTest = suite('link-citations')

rehypeCitationTest('supports link citation for numeric citation format', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950]</div>`, {
    csl: 'vancouver',
    suppressBibliography: true,
    linkCitations: true,
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1">(<a href="#bib-nash1950">1</a>)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('multiple citations for numeric citation format', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950;@Nash1950]</div>`, {
    csl: 'vancouver',
    suppressBibliography: true,
    linkCitations: true,
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--nash1950--1">(<a href="#bib-nash1950">1</a>,<a href="#bib-nash1950">1</a>)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('citation link should have same key as bib', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950;@Nash1951]</div>`, {
    csl: 'vancouver',
    suppressBibliography: false,
    linkCitations: true,
  })
  assert.ok(result.match(/id="bib-nash1950"/g))
  assert.ok(result.match(/#bib-nash1950/g))
  assert.ok(result.match(/id="bib-nash1951"/g))
  assert.ok(result.match(/#bib-nash1951/g))
})

rehypeCitationTest.run()
