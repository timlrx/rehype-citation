/**
 * @typedef Options
 *   Configuration.
 * @property {string | string[]} [bibliography]
 *   Name or path to Bibtex, CSL-JSON or CFF file. If multiple files are provided, they will be merged.
 * @property {string} [path]
 *   Optional path to file (node). Will be joined with `options.bibliography` and used in place of cwd of file if provided.
 * @property {'apa'|'vancouver'|'harvard1'|'chicago'|'mla'|string} [csl]
 *   One of 'apa', 'vancouver', 'harvard1', 'chicago', 'mla'. A local file path or URL to a valid CSL file is also accepted.
 * @property {string} [lang]
 *   Locale to use in formatting citations. Defaults to en-US. A local file path or URL to a valid locale file is also accepted.
 * @property {boolean} [suppressBibliography]
 *   By default, biliography is inserted after the entire markdown file.
 *   If the file contains `[^Ref]`, the biliography will be inserted there instead.
 * @property {boolean} [linkCitations]
 *   If true, citations will be hyperlinked to the corresponding bibliography entries (for author-date and numeric styles only).
 *   Defaults to false.
 * @property {string[]} [noCite]
 *   Citation IDs (@item1) to include in the bibliography even if they are not cited in the document
 * @property {string[]} [inlineClass]
 *   Class(es) to add to the inline citation.
 * @property {string[]} [inlineBibClass]
 *   Class(es) to add to the inline bibliography. Leave empty for no inline bibliography.
 *  @property {boolean} [showTooltips]
 *   If true, citations will show the full bibliography entry as a tooltip on hover.
 *   @property {string} [tooltipAttribute]
 *   The HTML attribute to use for tooltips. Can be 'title' or any custom data attribute
 *   (e.g., 'data-citation-text'). Defaults to 'title'.
 */

/**
 * @typedef CiteItemSuffix
 *  This interface describes the potential return of the parseSuffix function. It
 *  can return a locator, a label, and a suffix. More specifically, it will return
 *  a label in any case, defaulting to "page", just like citeproc.
 * @property {string} [locator]
 * @property {string} [label]
 * @property {string} [suffix]
 * /

/**
 * @typedef CiteItem
 *   Cite item to be passed into citeproc-js
 * @property {string} [id]
 *   The id field is required
 * @property {string} [locator]
 *   A string identifying a page number or other pinpoint location or range within the resource;
 * @property {string} [label]
 *   Path to file
 * @property {string} [prefix]
 *   A string to print before this cite item
 * @property {string} [suffix]
 *   A string to print after this cite item
 * @property {boolean} [suppress-author]
 *   If true, author names will not be included in the citation output for this cite
 * @property {boolean} [author-only]
 *   If true, only the author name will be included in the citation output for this cite
 *
 * @typedef {"note" | "in-text"} Mode
 * @typedef {'author-date' | 'author' | 'numeric' | 'note' | 'label'} CitationFormat
 */

export const Types = {}
