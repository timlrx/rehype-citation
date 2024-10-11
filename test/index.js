import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { rehype } from 'rehype'
import dedent from 'dedent'
import rehypeCitation from '../index.js'

const bibliography = './test/references-data.bib'
const cslJSON = './test/csl-json-data.json'
const cff = './test/CITATION.cff'
const urlCff = './test/pytorch-CITATION.cff'

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
  const expected = dedent`<div><span class="" id="citation--nash1950--1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('parse in-text citation correctly', async () => {
  const result = await processHtml('<div>@Nash1950</div>', { suppressBibliography: true })
  const expected = dedent`<div><span class="" id="citation--nash1950--1">Nash (1950)</span></div>`
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
  const expected = dedent`<div><span class="" id="citation--nash1951--1">(1)</span> text <span class="" id="citation--nash1950--2">(2)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('parses citation in tables', async () => {
  const result = await processHtml(
    '<div><table><tr><th>Header [@Nash1951]</th></tr><tr><td>Content [@Nash1950]</td></tr></table></div>',
    {
      suppressBibliography: true,
      csl: 'vancouver',
    }
  )
  const expected = dedent`<div><table><tbody><tr><th>Header <span class="" id="citation--nash1951--1">(1)</span></th></tr><tr><td>Content <span class="" id="citation--nash1950--2">(2)</span></td></tr></tbody></table></div>`
  assert.is(result, expected)
})

rehypeCitationTest('parse multiple citations correctly', async () => {
  const result = await processHtml(
    '<div>First citation @Nash1950 and second citation [@Nash1951]</div>',
    { suppressBibliography: true }
  )
  const expected = dedent`<div>First citation <span class="" id="citation--nash1950--1">Nash (1950)</span> and second citation <span class="" id="citation--nash1951--2">(Nash, 1951)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('inserts biliography at the end of the file', async () => {
  const result = await processHtml('<div>[@Nash1950]</div>')
  const expected = dedent`<div><span class="" id="citation--nash1950--1">(Nash, 1950)</span></div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry" id="bib-nash1950">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})

rehypeCitationTest('inserts biliography at [^ref] div tag', async () => {
  const result = await processHtml('<div>[^ref]</div><div>[@Nash1950]</div>')
  const expected = dedent`<div id="refs" class="references csl-bib-body">
          <div class="csl-entry" id="bib-nash1950">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div><div><span class="" id="citation--nash1950--1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('supports other specified csl', async () => {
  const result = await processHtml('<div>@Nash1950</div>', {
    suppressBibliography: true,
    csl: 'chicago',
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1">Nash (1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('process HTML code', async () => {
  const result = await processHtml('<div>@verma-rubin</div>', {
    suppressBibliography: true,
  })
  const expected = dedent`<div><span class="" id="citation--verma-rubin--1">Verma &#x26; Rubin (2018)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('supports csl from local path', async () => {
  const result = await processHtml('<div>[@Nash1950]</div>', {
    suppressBibliography: true,
    csl: './test/nature.csl',
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1"><sup>1</sup></span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('throw error if invalid csl', async () => {
  try {
    await processHtml(dedent`<div>[@Nash1950]</div>`, {
      suppressBibliography: true,
      csl: 'unknown-csl',
    })
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.instance(err, Error)
    assert.match(err.message, `Input CSL option, unknown-csl, is invalid or is an unknown file`)
  }
})

rehypeCitationTest('supports locale from local path', async () => {
  const result = await processHtml('<div>[@Nash1950]</div>', {
    suppressBibliography: true,
    lang: './test/bg-BG.xml',
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('supports locale from url', async () => {
  const result = await processHtml('<div>[@Nash1950]</div>', {
    suppressBibliography: true,
    lang: 'https://raw.githubusercontent.com/citation-style-language/locales/master/locales-zh-TW.xml',
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('throw error if invalid locale', async () => {
  try {
    await processHtml(dedent`<div>[@Nash1950]</div>`, {
      suppressBibliography: true,
      lang: 'unknown-lang',
    })
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.instance(err, Error)
    assert.match(err.message, `Input locale option, unknown-lang, is invalid or is an unknown file`)
  }
})

rehypeCitationTest('parse li', async () => {
  const result = await processHtml('<ul><li>@Nash1950</li></ul>', { suppressBibliography: true })
  const expected = dedent`<ul><li><span class="" id="citation--nash1950--1">Nash (1950)</span></li></ul>`
  assert.is(result, expected)
})

rehypeCitationTest('no-cite', async () => {
  const result = await processHtml('<div>text</div>', {
    noCite: ['@Nash1950'],
  })
  const expected = dedent`<div>text</div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry" id="bib-nash1950">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})
+
rehypeCitationTest('no-cite citations must be added to template citations', async () => {
  const result = await processHtml('<div>[@Nash1950]</div>', {
    noCite: ['@Nash1951'],
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1">(Nash, 1950)</span></div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry" id="bib-nash1950">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
          <div class="csl-entry" id="bib-nash1951">Nash, J. (1951). Non-cooperative games. <i>Annals of Mathematics</i>, 286–295.</div>
        </div>`
  assert.is(result, expected)
})


rehypeCitationTest('no-cite catch all', async () => {
  const result = await processHtml('<div>text</div>', {
    noCite: ['@*'],
  })
  const expected = dedent`<div>text</div><div id="refs" class="references csl-bib-body">
    <div class="csl-entry" id="bib-macfarlane2006">MacFarlane, J. (2006). <i>Pandoc: a universal document converter</i>. https://pandoc.org/</div>
    <div class="csl-entry" id="bib-nash1950">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
    <div class="csl-entry" id="bib-nash1951">Nash, J. (1951). Non-cooperative games. <i>Annals of Mathematics</i>, 286–295.</div>
    <div class="csl-entry" id="bib-verma-rubin">Verma, S., &#x26; Rubin, J. (2018). Fairness definitions explained. <i>2018 Ieee/Acm International Workshop on Software Fairness (Fairware)</i>, 1–7.</div>
    <div class="csl-entry" id="bib-xie2016">Xie, Y. (2016). <i>Bookdown: authoring books and technical documents with R markdown</i>. CRC Press.</div>
  </div>`
  assert.is(result, expected)
})

rehypeCitationTest('handle prefix, suffix and locator', async () => {
  const result = await processHtml(dedent`<div>[see @Nash1950, 5-6 suffix]</div>`, {
    suppressBibliography: true,
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1">(see Nash, 1950, pp. 5–6 suffix)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('suppress author', async () => {
  const result = await processHtml(dedent`<div>[-@Nash1950]</div>`, { suppressBibliography: true })
  const expected = dedent`<div><span class="" id="citation--nash1950--1">(1950)</span></div>`
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
    assert.is(err.code, 'ENOENT')
  }
})

rehypeCitationTest('works with csl-json', async () => {
  const result = await processHtml(
    dedent`<div>[@Q23571040]</div>`,
    { suppressBibliography: true },
    cslJSON
  )
  const expected = dedent`<div><span class="" id="citation--q23571040--1">(Hall, 1957)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('works with url bibliography path', async () => {
  const result = await processHtml(
    dedent`<div>[@Abu-Zeid_1986]</div>`,
    { suppressBibliography: true },
    'https://raw.githubusercontent.com/retorquere/zotero-better-bibtex/v6.0.0/test/fixtures/import/Author%20splitter%20failure.bib'
  )
  const expected = dedent`<div><span class="" id="citation--abu-zeid_1986--1">(Abu-Zeid et al., 1986)</span></div>`
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
  const expected = dedent`<div><span class="testClass" id="citation--nash1950--1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('works with multiple inline classes', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950]</div>`, {
    suppressBibliography: true,
    inlineClass: ['testClass', 'testClass2'],
  })
  const expected = dedent`<div><span class="testClass testClass2" id="citation--nash1950--1">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('generates inline bib', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950]</div>`, {
    suppressBibliography: true,
    inlineBibClass: ['testBibClass', 'testBibClass2'],
  })
  const expected = dedent`<div>
    <span class="" id="citation--nash1950--1">(Nash, 1950)</span>
    <div class="testBibClass testBibClass2" id="inlineBib--nash1950--1">
    <div class="inline-entry" id="inline--nash1950--1">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
    </div>
    </div>`.replace(/\n/g, '')
  assert.is(result, expected)
})

rehypeCitationTest('generates multiple inline bibs', async () => {
  const result = await processHtml(dedent`<div>[@Nash1950; @Nash1951]</div>`, {
    suppressBibliography: true,
    inlineBibClass: ['testBibClass', 'testBibClass2'],
  })
  const expected = dedent`<div>
    <span class="" id="citation--nash1950--nash1951--1">(Nash, 1950, 1951)</span>
    <div class="testBibClass testBibClass2" id="inlineBib--nash1950--nash1951--1">
    <div class="inline-entry" id="inline--nash1950--1">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
    <div class="inline-entry" id="inline--nash1951--1">Nash, J. (1951). Non-cooperative games. <i>Annals of Mathematics</i>, 286–295.</div>
    </div>
    </div>`.replace(/\n/g, '')
  assert.is(result, expected)
})

rehypeCitationTest('works with cff file and add doi as id', async () => {
  const result = await processHtml(
    dedent`<div>[@10.5281/zenodo.1234]</div>`,
    { suppressBibliography: true },
    cff
  )
  const expected = dedent`<div><span class="" id="citation--10.5281/zenodo.1234--1">(Lisa &#x26; Bot, 2017)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('adds url as id for preferred citation', async () => {
  const result = await processHtml(
    dedent`<div>[@papers.neurips.cc/paper/9015-pytorch-an-imperative-style-high-performance-deep-learning-library.pdf]</div>`,
    { suppressBibliography: true },
    urlCff
  )
  const expected = dedent`<div><span class="" id="citation--papers.neurips.cc/paper/9015-pytorch-an-imperative-style-high-performance-deep-learning-library.pdf--1">(Paszke et al., 2019)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest('parses multiple bibliography files', async () => {
  const result = await processHtml(
    dedent`<div>[@10.5281/zenodo.1234] and [@Nash1950]</div>`,
    { suppressBibliography: true },
    [bibliography, cff]
  )
  const expected = dedent`<div><span class="" id="citation--10.5281/zenodo.1234--1">(Lisa &#x26; Bot, 2017)</span> and <span class="" id="citation--nash1950--2">(Nash, 1950)</span></div>`
  assert.is(result, expected)
})

rehypeCitationTest.run()
