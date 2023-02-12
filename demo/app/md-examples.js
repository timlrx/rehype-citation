export const defaultExample = `## Welcome

Rehype plugin to nicely format citations in markdown
documents and insert bibliography in html format.

- Supports standard citations [@Nash1950{pp. iv, vi-xi, (xv)-(xvii)}];
- in-text citations, @Nash1951 [p. 33] says blah;
- and multiple citations [see @Nash1950 pp 12-13; @Nash1951]

Customizable CSL and locale.

### Bibliography
`

export const SuppressBibliographyExample = `## Welcome

Rehype plugin to nicely format citations in markdown
documents and insert bibliography in html format.

- Supports standard citations [@Nash1950{pp. iv, vi-xi, (xv)-(xvii)}];
- in-text citations, @Nash1951 [p. 33] says blah;
- and multiple citations [see @Nash1950 pp 12-13; @Nash1951]

Customizable CSL and locale.
`

export const CustomCSLExample = `## Welcome

Choose from one of the multiple preconfigured CSLs[^1]
[^1]: apa, vancouver, harvard1, chicago, mla

or pass in a valid file path or url to the _csl_ argument.

Here's an example in ACM format:

- Supports standard citations [@Nash1950{pp. iv, vi-xi, (xv)-(xvii)}];
- You probably don't want in-text citation with a note style;
- and multiple citations [see @Nash1950 pp 12-13; @Nash1951]

### References
`

export const FootnotesExample = `## Welcome

The plugin also works with Github formatted footnotes
from remarkgfm and automatically merges user content with citations.[^1]

[^1]: There's no guarantee it works with other footnote formats since
it searches for specific ids and hrefs added by GFM

Here's an example in Chicago fullnote style:

- Supports standard citations[@Nash1950{pp. iv, vi-xi, (xv)-(xvii)}];
- Avoid in-text citations for footnote citations;
- and multiple citations[see @Nash1950 pp 12-13; @Nash1951]

### References
`

export const LinkCitationsExample = `## Welcome

Rehype plugin to nicely format citations in markdown
documents and insert bibliography in html format.

- Supports standard citations [@Nash1950{pp. iv, vi-xi, (xv)-(xvii)}];
- in-text citations, @Nash1951 [p. 33] says blah;
- and multiple citations [see @Nash1950 pp 12-13; @Nash1951]

The _link-citations_ option can be used to add a link from citations to the references sections.

This applies to numeric and author-date styles only.

Implementation might differ from Pandoc, but if you run into any problems please file an issue.

### Bibliography
`
