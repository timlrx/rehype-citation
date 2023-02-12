// Regex adapted from https://github.com/Zettlr/Zettlr/blob/develop/source/common/util/extract-citations.ts

/**
 * Citation detection: The first alternative matches "full" citations surrounded
 * by square brackets, whereas the second one matches in-text citations,
 * optionally with suffixes.
 *
 * * Group 1 matches regular "full" citations
 * * Group 2 matches in-text citations (not surrounded by brackets)
 * * Group 3 matches optional square-brackets suffixes to group 2 matches
 *
 * For more information, see https://pandoc.org/MANUAL.html#extension-citations
 *
 * @var {RegExp}
 */
export const citationRE =
  /(?:\[([^[\]]*@[^[\]]+)\])|(?<=\s|^|(-))(?:@([\p{L}\d_][^\s]*[\p{L}\d_]|\{.+\})(?:\s+\[(.*?)\])?)/u

/**
 * I hate everything at this. This can match every single possible variation on
 * whatever the f*** you can possibly do within square brackets according to the
 * documentation. I opted for named groups for these because otherwise I have no
 * idea what I have been doing here.
 *
 * * Group prefix: Contains the prefix, ends with a dash if we should suppress the author
 * * Group citekey: Contains the actual citekey, can be surrounded in curly brackets
 * * Group explicitLocator: Contains an explicit locator statement. If given, we MUST ignore any form of locator in the suffix
 * * Group explicitLocatorInSuffix: Same as above, but not concatenated to the citekey
 * * Group suffix: Contains the suffix, but may start with a locator (if explicitLocator and explicitLocatorInSuffix are not given)
 *
 * @var {RegExp}
 */
export const fullCitationRE =
  /(?<prefix>.+)?(?:@(?<citekey>[\p{L}\d_][^\s{]*[\p{L}\d_]|\{.+\}))(?:\{(?<explicitLocator>.*)\})?(?:,\s+(?:\{(?<explicitLocatorInSuffix>.*)\})?(?<suffix>.*))?/u

/**
 * This regular expression matches locator ranges, like the following:
 *
 * * 23-45, and further (here it matches up to, not including the comma)
 * * 45
 * * 15423
 * * 14235-12532
 * * 12-34, 23, 56
 * * 12, 23-14, 23
 * * 12, 54, 12-23
 * * 1, 1-4
 * * 3
 * * NEW NEW NEW: Now also matches Roman numerals as sometimes used in forewords!
 *
 * @var {RegExp}
 */
export const locatorRE = /^(?:[\d, -]*\d|[ivxlcdm, -]*[ivxlcdm])/i
