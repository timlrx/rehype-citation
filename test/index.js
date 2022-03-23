import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { rehype } from 'rehype'
import dedent from 'dedent'
import rehypeCitation from '../index.js'

const bibliography = './test/references-data.bib'
const cslJSON = './test/csl-json-data.json'

const processHtml = (html, options, input = bibliography) => {
  return rehype()
    .data('settings', { fragment: true })
    .use(rehypeCitation, { bibliography: input, ...options })
    .process(html)
    .then((file) => String(file))
}

const rehypeCitationTest = suite('rehype-citation')

rehypeCitationTest('parse citation correctly', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950]</div>`, { suppressBibliography: true })
  const expected = dedent`<div><span class="" id="citation-1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('parse in-text citation correctly', async () => {
  const result = await processHtml('<div>@Nash1950</div>', { suppressBibliography: true })
  const expected = dedent`<div><span class="" id="citation-1">Nash (1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('do not parse unknown citation-like text', async () => {
  const result = await processHtml('<div>@apply</div>')
  const expected = dedent`<div>@apply</div>`
  assert.is(result, expected)
})

rehypeCitationTest('properly account for previous citation', async () => {
  const result = await processHtml('<div>[@Nash1951] text [@Nash1950]</div>', {
    suppressBibliography: true,
    csl: 'vancouver',
  })
  const expected = dedent`<div><span class="" id="citation-1">(1)</span> text <span class="" id="citation-2">(2)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('parse multiple citations correctly', async () => {
  const result = await processHtml(
    '<div>First citation @Nash1950 and second citation [@Nash1951]</div>',
    { suppressBibliography: true }
  )
  const expected = dedent`<div>First citation <span class="" id="citation-1">Nash (1950)</span> and second citation <span class="" id="citation-2">(Nash, 1951)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('inserts biliography at the end of the file', async () => {
  const result = await processHtml('<div>[@Nash1950]</div>')
  const expected = dedent`<div><span class="" id="citation-1">(Nash, 1950)</span></div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})

rehypeCitationTest('inserts biliography at [^ref] div tag', async () => {
  const result = await processHtml('<div>[^ref]</div><div>[@Nash1950]</div>')
  const expected = dedent`<div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div><div><span class="" id="citation-1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('supports other specified csl', async () => {
  const result = await processHtml('<div>@Nash1950</div>', {
    suppressBibliography: true,
    csl: 'chicago',
  })
  const expected = dedent`<div><span class="" id="citation-1">Nash (1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('process HTML code', async () => {
  const result = await processHtml('<div>@verma-rubin</div>', {
    suppressBibliography: true,
  })
  const expected = dedent`<div><span class="" id="citation-1">Verma &#x26; Rubin (2018)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('supports csl from path', async () => {
  const result = await processHtml('<div>@Nash1950</div>', {
    suppressBibliography: true,
    csl: './csl/chicago.csl',
  })
  const expected = dedent`<div><span class="" id="citation-1">Nash (1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('parse li', async () => {
  const result = await processHtml('<ul><li>@Nash1950</li></ul>', { suppressBibliography: true })
  const expected = dedent`<ul><li><span class="" id="citation-1">Nash (1950)</span></li></ul>`
  assert.is(result, expected)
})

rehypeCitationTest('no-cite', async () => {
  const result = await processHtml('<div>text</div>', {
    noCite: ['@Nash1950'],
  })
  const expected = dedent`<div>text</div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})

rehypeCitationTest('handle prefix, suffix and locator', async () => {
  const result = await processHtml(dedent`<div>[see @Nash1950, 5-6 suffix]</div>`, {
    suppressBibliography: true,
  })
  const expected = dedent`<div><span class="" id="citation-1">(see Nash, 1950, pp. 5–6 suffix)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('suppress author', async () => {
  const result = await processHtml(dedent`<div>[-@Nash1950]</div>`, { suppressBibliography: true })
  const expected = dedent`<div><span class="" id="citation-1">(1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('throw an error if invalid file path', async () => {
  try {
    await processHtml(
      `<div>[-@Nash1950]</div>`,
      { suppressBibliography: true },
      './test/invalid-file-path.bib'
    )
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.instance(err, Error)
  }
})

rehypeCitationTest('works with csl-json', async () => {
  const result = await processHtml(
    dedent`<div>[@Q23571040]</div>`,
    { suppressBibliography: true },
    cslJSON
  )
  const expected = dedent`<div><span class="" id="citation-1">(Hall, 1957)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('works with url bibliography path', async () => {
  const result = await processHtml(
    dedent`<div>[@Abu-Zeid_1986]</div>`,
    { suppressBibliography: true },
    'https://raw.githubusercontent.com/retorquere/zotero-better-bibtex/v6.0.0/test/fixtures/import/Author%20splitter%20failure.bib'
  )
  const expected = dedent`<div><span class="" id="citation-1">(Abu-Zeid et al., 1986)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('throw error if invalid url path', async () => {
  try {
    await processHtml(
      dedent`<div>[@Nash1950]</div>`,
      { suppressBibliography: true },
      'https://raw.githubusercontent.com/timlrx/rehype-citation/main/test/invalid.bib'
    )
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.instance(err, Error)
  }
})

rehypeCitationTest('works with an inline class', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950]</div>`, {
    suppressBibliography: true,
    inlineClass: ['testClass'],
  })
  const expected = dedent`<div><span class="testClass" id="citation-1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('works with multiple inline classes', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950]</div>`, {
    suppressBibliography: true,
    inlineClass: ['testClass', 'testClass2'],
  })
  const expected = dedent`<div><span class="testClass testClass2" id="citation-1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest.run()
