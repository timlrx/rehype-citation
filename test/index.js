import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { rehype } from 'rehype'
import dedent from 'dedent'
import rehypeCitation from '../index.js'

const bibliography = './test/references-data.bib'
const cslJSON = './test/csl-json-data.json'
const path = process.cwd()

const processHtml = (html, options, input = bibliography) => {
  return rehype()
    .data('settings', { fragment: true })
    .use(rehypeCitation, { bibliography: input, path, ...options })
    .processSync(html)
    .toString()
}

const rehypeCitationTest = suite('rehype-citation')

rehypeCitationTest('parse citation correctly', () => {
  const result = processHtml(dedent`<div>[@Nash1950]</div>`, { suppressBibliography: true })
  const expected = dedent`<div>(Nash, 1950)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('parse in-text citation correctly', () => {
  const result = processHtml('<div>@Nash1950</div>', { suppressBibliography: true })
  const expected = dedent`<div>Nash (1950)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('properly account for previous citation', () => {
  const result = processHtml('<div>[@Nash1951] text [@Nash1950]</div>', {
    suppressBibliography: true,
    csl: 'vancouver',
  })
  const expected = dedent`<div>(1) text (2)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('parse multiple citations correctly', () => {
  const result = processHtml(
    '<div>First citation @Nash1950 and second citation [@Nash1951]</div>',
    { suppressBibliography: true }
  )
  const expected = dedent`<div>First citation Nash (1950) and second citation (Nash, 1951)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('inserts biliography at the end of the file', () => {
  const result = processHtml('<div>[@Nash1950]</div>')
  const expected = dedent`<div>(Nash, 1950)</div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})

rehypeCitationTest('inserts biliography at [^Ref] div tag', () => {
  const result = processHtml('<div>[^Ref]</div><div>[@Nash1950]</div>')
  const expected = dedent`<div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div><div>(Nash, 1950)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('supports other specified csl', () => {
  const result = processHtml('<div>@Nash1950</div>', { suppressBibliography: true, csl: 'chicago' })
  const expected = dedent`<div>Nash (1950)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('supports csl from path', () => {
  const result = processHtml('<div>@Nash1950</div>', {
    suppressBibliography: true,
    csl: './csl/chicago.csl',
  })
  const expected = dedent`<div>Nash (1950)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('no-cite', () => {
  const result = processHtml('<div>text</div>', {
    noCite: ['@Nash1950'],
  })
  const expected = dedent`<div>text</div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})

rehypeCitationTest('handle prefix, suffix and locator', () => {
  const result = processHtml(dedent`<div>[see @Nash1950, 5-6 suffix]</div>`, {
    suppressBibliography: true,
  })
  const expected = dedent`<div>(see Nash, 1950, pp. 5–6 suffix)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('suppress author', () => {
  const result = processHtml(dedent`<div>[-@Nash1950]</div>`, { suppressBibliography: true })
  const expected = dedent`<div>(1950)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('throw an error if invalid file path', () => {
  const result = processHtml(
    dedent`<div>[-@Nash1950]</div>`,
    { suppressBibliography: true },
    './test/invalid-file-path.bib'
  )
  const expected = dedent`<div>(1950)</div>`
  assert.is(result, expected)
})

rehypeCitationTest('works with csl-json', () => {
  const result = processHtml(
    dedent`<div>[@Q23571040]</div>`,
    { suppressBibliography: true },
    cslJSON
  )
  const expected = dedent`<div>(Hall, 1957)</div>`
  assert.is(result, expected)
})

rehypeCitationTest.run()
