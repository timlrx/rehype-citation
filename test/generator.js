import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { rehype } from 'rehype'
import dedent from 'dedent'
import vancouver from '../styles/vancouver.js'
import zhCN from '../locales/zh-CN.js'
import Cite from '../src/cite.js'
import rehypeCitationGenerator from '../src/generator.js'

const bibliography = './test/references-data.bib'

const processHtml = (rehypeCitation, html, options, input = bibliography) => {
  return rehype()
    .data('settings', { fragment: true })
    .use(rehypeCitation, { bibliography: input, ...options })
    .process(html)
    .then((file) => String(file))
}
const generatorTest = suite('generator')

generatorTest('custom cite plugin', async () => {
  const rehypeCitation = rehypeCitationGenerator(Cite)
  const result = await processHtml(rehypeCitation, `<div>[@Nash1950]</div>`)
  const expected = dedent`<div><cite class="" id="citation--nash1950--1">(Nash, 1950)</cite></div><div id="refs" class="references csl-bib-body">
          <div class="csl-entry" id="bib-nash1950">Nash, J. (1950). Equilibrium points in n-person games. <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.</div>
        </div>`
  assert.is(result, expected)
})

generatorTest('custom locale', async () => {
  const config = Cite.plugins.config.get('@csl')
  config.locales.add('zh-CN', zhCN)
  const rehypeCitation = rehypeCitationGenerator(Cite)
  const result = await processHtml(rehypeCitation, dedent`<div>[@Nash1950, chapter 1]</div>`, {
    suppressBibliography: true,
    lang: 'zh-CN',
  })
  const expected = dedent`<div><cite class="" id="citation--nash1950--1">(Nash, 1950, 章 1)</cite></div>`
  assert.is(result, expected)
})

generatorTest('properly account for previous citation', async () => {
  const config = Cite.plugins.config.get('@csl')
  config.templates.add('vancouver', vancouver)
  const rehypeCitation = rehypeCitationGenerator(Cite)
  const result = await processHtml(rehypeCitation, '<div>[@Nash1951] text [@Nash1950]</div>', {
    suppressBibliography: true,
    csl: 'vancouver',
  })
  const expected = dedent`<div><cite class="" id="citation--nash1951--1">(1)</cite> text <cite class="" id="citation--nash1950--2">(2)</cite></div>`
  assert.is(result, expected)
})

generatorTest.run()
