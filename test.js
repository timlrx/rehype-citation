import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { rehype } from 'rehype'
import dedent from 'dedent'
import rehypeCitation from './index.js'

const bibliography = 'references-test.bib'
const path = process.cwd()

const processHtml = (html, options) => {
  return rehype()
    .data('settings', { fragment: true })
    .use(rehypeCitation, { bibliography, path, ...options })
    .processSync(html)
    .toString()
}

test('parse citation correctly', () => {
  const result = processHtml(
    dedent`
    <div>[@Nash1950]</div>
  `,
    { suppressBibliography: true }
  )
  const expected = dedent`<div>(Nash, 1950)</div>`
  assert.is(result, expected)
})

test('parse in-text citation correctly', () => {
  const result = processHtml('<div>@Nash1950</div>', { suppressBibliography: true })
  const expected = dedent`<div>Nash (1950)</div>`
  assert.is(result, expected)
})

test('properly account for previous citation', () => {
  const result = processHtml('<div>[@Nash1951] text [@Nash1950]</div>', {
    suppressBibliography: true,
    csl: 'vancouver',
  })
  const expected = dedent`<div>(1) text (2)</div>`
  assert.is(result, expected)
})

test('parse multiple citations correctly', () => {
  const result = processHtml(
    '<div>First citation @Nash1950 and second citation [@Nash1951]</div>',
    { suppressBibliography: true }
  )
  const expected = dedent`<div>First citation Nash (1950) and second citation (Nash, 1951)</div>`
  assert.is(result, expected)
})

test('inserts biliography at the end of the file', () => {
  const result = processHtml('<div>[@Nash1950]</div>')
  const expected = dedent`<div>(Nash, 1950)</div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})

test('inserts biliography at [^Ref] div tag', () => {
  const result = processHtml('<div>[^Ref]</div><div>[@Nash1950]</div>')
  const expected = dedent`<div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div><div>(Nash, 1950)</div>`
  assert.is(result, expected)
})

test('supports other specified csl', () => {
  const result = processHtml('<div>@Nash1950</div>', { suppressBibliography: true, csl: 'chicago' })
  const expected = dedent`<div>Nash (1950)</div>`
  assert.is(result, expected)
})

test('supports csl from path', () => {
  const result = processHtml('<div>@Nash1950</div>', {
    suppressBibliography: true,
    csl: './csl/chicago.csl',
  })
  const expected = dedent`<div>Nash (1950)</div>`
  assert.is(result, expected)
})

test('no-cite', () => {
  const result = processHtml('<div>text</div>', {
    noCite: ['@Nash1950'],
  })
  const expected = dedent`<div>text</div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})

test.run()
