![rehype citation](./rehype-citation.png)

# Rehype-Citation

[![GitHub Repo stars](https://img.shields.io/github/stars/timlrx/rehype-citation?style=social)](https://GitHub.com/timlrx/rehype-citation/stargazers/)
[![GitHub forks](https://img.shields.io/github/forks/timlrx/rehype-citation?style=social)](https://GitHub.com/timlrx/rehype-citation/network/)
[![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2Ftimlrxx)](https://twitter.com/timlrxx)
[![Sponsor](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&link=https://github.com/sponsors/timlrx)](https://github.com/sponsors/timlrx)
[![DOI](https://zenodo.org/badge/419657013.svg)](https://zenodo.org/doi/10.5281/zenodo.10004327)

[rehype](https://github.com/wooorm/rehype) plugin to nicely format citations in markdown documents and insert bibliography in html format. It is meant to be used as a server side plugin and neatly integrates [citeproc-js](https://github.com/Juris-M/citeproc-js) and [citation-js](https://github.com/citation-js/citation-js) within the remark-rehype ecosystem. Parsing of citations and all the wonderful regexes are adapted from [Zettlr](https://github.com/Zettlr/Zettlr).

It supports both normal citations (such as [@foo]) and in-text citation (such as @foo), as well as author-date, numerical, and note styles.

Note styles is only compatible with Github Formatted Markdown (GFM). It is recommended to run `remark-gfm` before `rehype-citation` to ensure all footnote elements are correctly formatted.

API and options follows very closely to [Rmarkdown](https://bookdown.org/yihui/rmarkdown-cookbook/bibliography.html) and [Pandoc](https://pandoc.org/MANUAL.html#citations)

## Examples

- [Citations with Bibliography](https://rehype-citation.netlify.app)
- [Suppress Bibliography](https://rehype-citation.netlify.app/suppress-bibliography)
- [Custom CSL](https://rehype-citation.netlify.app/custom-csl)
- [Footnote style](https://rehype-citation.netlify.app/footnote-style)
- [Link Citations](https://rehype-citation.netlify.app/link-citations)

## Installation

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

```js
npm install rehype-citation
```

## Usage

If you are using the plugin in a node environment, import from `rehype-citation/node`. For browser environments, import from `rehype-citation/browser`.

The following files are exported:

`generator`, generator function. Can be used to generate a rehype citation plugin. Takes in a citation-js `Cite` class.
`cite`, a citation-js `Cite` instance. Add your own CSL / locales before passing in to the plugin generator .
`rehype-citation`, re-exports the above 2 packages with a pre-configured `rehype-citation` plugin ready to use. Importing from `rehype-citation` directs to this file.

Use this package [as a rehype plugin](https://github.com/rehypejs/rehype/blob/master/doc/plugins.md#using-plugins).

Some examples of how you might do that:

```js
import rehype from 'rehype'
import rehypeCitation from 'rehype-citation'

rehype().use(rehypeCitation).process(/* some html */)
```

## Sample markdown to HTML output

Input:

```md
My markdown text [@Nash1950]
```

HTML Output:

```html
<div>My markdown text (Nash, 1950)</div>
<div id="refs" class="references csl-bib-body">
  <div class="csl-entry">
    Nash, J. (1950). Equilibrium points in n-person games.
    <i>Proceedings of the National Academy of Sciences</i>, <i>36</i>(1), 48–49.
  </div>
</div>
```

## Generating your own remark citation plugins

The default plugin comes configured with the `en-US` locale and the following CSL styles: apa, vancouver, harvard1, chicago and mla.

Use the generator function to customize your own remark-citation plugin and add your own [CSL styles](https://github.com/citation-style-language/styles) or [locales](https://github.com/citation-style-language/locales).

```js
import Cite from 'rehype-citation/cite'
import rehypeCitationGenerator from 'rehype-citation/generator'
import myStyle from '../style'
import myLocale from '../locale'

const config = Cite.plugins.config.get('@csl')
config.templates.add('mystyle', myStyle)
config.locales.add('myLocale', myLocale)

const rehypeCitation = rehypeCitationGenerator(Cite)
```

## API

`rehype().use(rehypeCitation, [options])`

If no `bibliography` file is passed, the plugin will be skipped.

### options

#### options.bibliography

Type: `string|string[]`.

By default, if no `bibliography` file is passed, the plugin will be skipped.

Name or path to Bibtex, CSL-JSON or CFF file. If multiple files are provided, they will be merged.

#### options.path

Type: `string`.
Default: `process.cwd()`.

Required, path to file. Will be joined with `options.bibliography` and `options.csl`, if provided.

#### options.csl

Type: `'apa'|'vancouver'|'harvard1'|'chicago'|'mla'|string`.
Default: `apa`.

For the main `rehypeCitation` plugin, one of 'apa', 'vancouver', 'harvard1', 'chicago', 'mla'. A local file path or URL to a valid CSL file is also accepted. Can also be specified as a frontmatter option in the markdown file to override the default.

#### options.lang

Type: `string`.
Default: `en-US`.

Locale to use in formatting citations. Defaults to `en-US`. A local file path or URL to a valid locale file is also accepted.

#### options.suppressBibliography

Type: `boolean`.
Default: `false`.

Suppress bibliography? By default, biliography is inserted after the entire markdown file. If the file contains `[^ref]`, the biliography will be inserted there instead.

#### options.noCite

Type: `string[]`.

Citation IDs (@item1) to include in the bibliography even if they are not cited in the document. Can also be specified as a frontmatter option in the markdown file.

#### options.inlineClass

Type: `string[]`.

Array of classes for inline citations.

#### options.inlineBibClass

Type: `string[]`.

Array of classes for inline bibliography. Leave empty to disable inline bibliography.

#### options.linkCitations

Type: `boolean`.
Default: `false`.

If true, citations will be hyperlinked to the corresponding bibliography entries (for author-date and numeric styles only).
