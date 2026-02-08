import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { rehype } from 'rehype'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkGfm from 'remark-gfm'
import rehypeStringify from 'rehype-stringify'
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

const processHtmlGfm = (html, options, input = bibliography) => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {})
    .use(rehypeCitation, { bibliography: input, ...options })
    .use(rehypeStringify)
    .process(html)
    .then((file) => String(file))
}

const rehypeCitationTest = suite('note-style')

rehypeCitationTest('supports footnote style csl', async () => {
  const result = await processHtml('<div>[@Nash1950]</div>', {
    suppressBibliography: true,
    csl: 'https://raw.githubusercontent.com/citation-style-language/styles/refs/heads/master/chicago-notes-bibliography-17th-edition.csl',
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1"><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></span></div><section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>
<ol>
<li id="user-content-fn-1"><p><span>John Nash, “Equilibrium Points in N-Person Games,” <i>Proceedings of the National Academy of Sciences</i> 36, no. 1 (1950): 48–49.</span><a href="#user-content-fnref-1" data-footnote-backref class="data-footnote-backref" aria-label="Back to content">↩</a></p>
</li></ol></section>`
  assert.is(result, expected)
})

rehypeCitationTest('handles multiple footnote', async () => {
  const result = await processHtml('<div>[@Nash1950] text [@Nash1951]</div>', {
    suppressBibliography: true,
    csl: 'https://raw.githubusercontent.com/citation-style-language/styles/refs/heads/master/chicago-notes-bibliography-17th-edition.csl',
  })
  const expected = dedent`<div><span class="" id="citation--nash1950--1"><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></span> text <span class="" id="citation--nash1951--2"><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup></span></div><section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>
<ol>
<li id="user-content-fn-1"><p><span>John Nash, “Equilibrium Points in N-Person Games,” <i>Proceedings of the National Academy of Sciences</i> 36, no. 1 (1950): 48–49.</span><a href="#user-content-fnref-1" data-footnote-backref class="data-footnote-backref" aria-label="Back to content">↩</a></p>
</li><li id="user-content-fn-2"><p><span>John Nash, “Non-Cooperative Games,” <i>Annals of Mathematics</i>, 1951, 286–95.</span><a href="#user-content-fnref-2" data-footnote-backref class="data-footnote-backref" aria-label="Back to content">↩</a></p>
</li></ol></section>`
  assert.is(result, expected)
})

rehypeCitationTest('integrates with github markdown', async () => {
  const result = await processHtmlGfm(`Hello world [@Nash1950]`, {
    suppressBibliography: true,
    csl: 'https://raw.githubusercontent.com/citation-style-language/styles/refs/heads/master/chicago-notes-bibliography-17th-edition.csl',
  })
  const expected = dedent`<p>Hello world <span class="" id="citation--nash1950--1"><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></span></p><section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>
<ol>
<li id="user-content-fn-1"><p><span>John Nash, “Equilibrium Points in N-Person Games,” <i>Proceedings of the National Academy of Sciences</i> 36, no. 1 (1950): 48–49.</span><a href="#user-content-fnref-1" data-footnote-backref class="data-footnote-backref" aria-label="Back to content">↩</a></p>
</li></ol></section>`
  assert.is(result, expected)
})

rehypeCitationTest('integrates with existing gfm footnote and re-numbers correctly', async () => {
  const result = await processHtmlGfm(
    dedent`
    Hello world [^1] some [@Nash1951] text [^abc] here
    [^1]: First note
    [^abc]: Second note
  `,
    {
      suppressBibliography: true,
      csl: 'https://raw.githubusercontent.com/citation-style-language/styles/refs/heads/master/chicago-notes-bibliography-17th-edition.csl',
    }
  )
  const expected = dedent`<p>Hello world <sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup> some <span class="" id="citation--nash1951--1"><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup></span> text <sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref aria-describedby="footnote-label">3</a></sup> here</p>
<section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>First note <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li><li id="user-content-fn-2"><p><span>John Nash, “Non-Cooperative Games,” <i>Annals of Mathematics</i>, 1951, 286–95.</span><a href="#user-content-fnref-2" data-footnote-backref class="data-footnote-backref" aria-label="Back to content">↩</a></p>
</li><li id="user-content-fn-3">
<p>Second note <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li></ol></section>`
  assert.is(result, expected)
})

rehypeCitationTest.run()
