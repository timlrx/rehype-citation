/**
 * @typedef {import('./types').CiteItem} CiteItem
 * @typedef {import('./types').CiteItemSuffix} CiteItemSuffix
 */

import { fullCitationRE, locatorRE } from './regex.js'

/**
 * The locatorLabels have been sourced from the Citr library. Basically it's just
 * a map with valid CSL locator labels and an array of possible natural labels
 * which a user might want to write (instead of the standardized labels).
 *
 * @var {{ [key: string]: string[] }}}
 */
const locatorLabels = {
  book: ['Buch', 'Bücher', 'B.', 'book', 'books', 'bk.', 'bks.', 'livre', 'livres', 'liv.'],
  chapter: ['Kapitel', 'Kap.', 'chapter', 'chapters', 'chap.', 'chaps', 'chapitre', 'chapitres'],
  column: ['Spalte', 'Spalten', 'Sp.', 'column', 'columns', 'col.', 'cols', 'colonne', 'colonnes'],
  figure: ['Abbildung', 'Abbildungen', 'Abb.', 'figure', 'figures', 'fig.', 'figs'],
  folio: ['Blatt', 'Blätter', 'Fol.', 'folio', 'folios', 'fol.', 'fols', 'fᵒ', 'fᵒˢ'],
  issue: [
    'Nummer',
    'Nummern',
    'Nr.',
    'number',
    'numbers',
    'no.',
    'nos.',
    'numéro',
    'numéros',
    'nᵒ',
    'nᵒˢ',
  ],
  line: ['Zeile', 'Zeilen', 'Z', 'line', 'lines', 'l.', 'll.', 'ligne', 'lignes'],
  note: ['Note', 'Noten', 'N.', 'note', 'notes', 'n.', 'nn.'],
  opus: ['Opus', 'Opera', 'op.', 'opus', 'opera', 'opp.'],
  page: ['Seite', 'Seiten', 'S.', 'page', 'pages', 'p.', 'pp.'],
  paragraph: [
    'Absatz',
    'Absätze',
    'Abs.',
    '¶',
    '¶¶',
    'paragraph',
    'paragraphs',
    'para.',
    'paras',
    'paragraphe',
    'paragraphes',
    'paragr.',
  ],
  part: ['Teil', 'Teile', 'part', 'parts', 'pt.', 'pts', 'partie', 'parties', 'part.'],
  section: [
    'Abschnitt',
    'Abschnitte',
    'Abschn.',
    '§',
    '§§',
    'section',
    'sections',
    'sec.',
    'secs',
    'sect.',
  ],
  'sub verbo': ['sub verbo', 'sub verbis', 's.&#160;v.', 's.&#160;vv.', 's.v.', 's.vv.'],
  verse: ['Vers', 'Verse', 'V.', 'verse', 'verses', 'v.', 'vv.', 'verset', 'versets'],
  volume: ['Band', 'Bände', 'Bd.', 'Bde.', 'volume', 'volumes', 'vol.', 'vols.'],
}

/**
 * Parses a given citation string and return entries and isComposite flag required for cite-proc.
 * Adapted from https://github.com/Zettlr/Zettlr/blob/develop/source/common/util/extract-citations.ts
 *
 * @param {RegExpMatchArray} regexMatch Cite string in the form of '[@item]' or '@item'
 * @return {[CiteItem[], boolean]} [entries, isComposite]
 */
export const parseCitation = (regexMatch) => {
  /** @type {CiteItem[]} */
  let entries = []
  let isComposite = false
  const fullCitation = regexMatch[1]
  const inTextSuppressAuthor = regexMatch[2]
  const inTextCitation = regexMatch[3]
  const optionalSuffix = regexMatch[4]

  if (fullCitation !== undefined) {
    // Handle citations in the form of [@item1; @item2]
    for (const citationPart of fullCitation.split(';')) {
      const match = fullCitationRE.exec(citationPart.trim())
      if (match === null) {
        continue // Faulty citation
      }
      // Prefix is the portion before @ e.g. [see @item1] or an empty string
      // We explicitly cast groups since we have groups in our RegExp and as
      // such the groups object will be set.
      /** @type {CiteItem} */
      const thisCitation = {
        id: match.groups.citekey.replace(/{(.+)}/, '$1'),
        prefix: undefined,
        locator: undefined,
        label: 'page',
        'suppress-author': false,
        suffix: undefined,
      }

      // First, deal with the prefix. The speciality here is that it can
      // indicate if we should suppress the author.
      const rawPrefix = match.groups.prefix
      if (rawPrefix !== undefined) {
        thisCitation['suppress-author'] = rawPrefix.trim().endsWith('-')
        if (thisCitation['suppress-author']) {
          thisCitation.prefix = rawPrefix.substring(0, rawPrefix.trim().length - 1).trim()
        } else {
          thisCitation.prefix = rawPrefix.trim()
        }
      }

      // Second, deal with the suffix. This one can be much more tricky than
      // the prefix. We have three alternatives where the locator may be
      // present: If we have an explicitLocator or an explicitLocatorInSuffix,
      // we should extract the locator from there and leave the actual suffix
      // untouched. Only if those two alternatives are not present, then we
      // have a look at the rawSuffix and extract a (potential) locator.
      const explicitLocator = match.groups.explicitLocator
      const explicitLocatorInSuffix = match.groups.explicitLocatorInSuffix
      const rawSuffix = match.groups.suffix

      let suffixToParse
      let containsLocator = true
      if (explicitLocator === undefined && explicitLocatorInSuffix === undefined) {
        // Potential locator in rawSuffix. Only in this case should we overwrite
        // the suffix (hence the same if-condition below)
        suffixToParse = rawSuffix
        containsLocator = false
      } else if (explicitLocatorInSuffix !== undefined || explicitLocator !== undefined) {
        suffixToParse = explicitLocator !== undefined ? explicitLocator : explicitLocatorInSuffix
        thisCitation.suffix = rawSuffix?.trim()
      }

      const { label, locator, suffix } = parseSuffix(suffixToParse, containsLocator)
      thisCitation.locator = locator

      if (label !== undefined) {
        thisCitation.label = label
      }

      if (explicitLocator === undefined && explicitLocatorInSuffix === undefined) {
        thisCitation.suffix = suffix
      } else if (suffix !== undefined && thisCitation.locator !== undefined) {
        // If we're here, we should not change the suffix, but parseSuffix may
        // have put something into the suffix return. If we're here, that will
        // definitely be a part of the locator.
        thisCitation.locator += suffix
      }

      entries.push(thisCitation)
    }
  } else {
    // We have an in-text citation, so we can take a shortcut
    isComposite = true
    entries.push({
      prefix: undefined,
      id: inTextCitation.replace(/{(.+)}/, '$1'),
      'suppress-author': inTextSuppressAuthor !== undefined,
      ...parseSuffix(optionalSuffix, false), // Populate more depending on the suffix
    })
  }
  return [entries, isComposite]
}

/**
 * This takes a suffix and extracts optional label and locator from this. Pass
 * true for the containsLocator property to indicate to this function that what
 * it got was not a regular suffix with an optional locator, but an explicit
 * locator so it knows it just needs to look for an optional label.
 *
 * @param {string} suffix           The suffix to parse
 * @param {boolean} containsLocator  If true, forces parseSuffix to return a locator
 *
 * @return {CiteItemSuffix} An object containing three optional properties locator, label, or suffix.
 */
function parseSuffix(suffix, containsLocator) {
  /** @type {CiteItemSuffix} */
  const retValue = {
    locator: undefined,
    label: 'page',
    suffix: undefined,
  }

  if (suffix === undefined) {
    return retValue
  }

  // Make sure the suffix does not start or end with spaces
  suffix = suffix.trim()

  // If there is a label, the suffix must start with it
  for (const label in locatorLabels) {
    for (const natural of locatorLabels[label]) {
      if (suffix.toLowerCase().startsWith(natural.toLowerCase())) {
        retValue.label = label
        if (containsLocator) {
          // The suffix actually is the full locator, we just had to extract
          // the label from it. There is no remaining suffix.
          retValue.locator = suffix.substr(natural.length).trim()
        } else {
          // The caller indicated that this is a regular suffix, so we must also
          // extract the locator from what is left after label extraction.
          retValue.suffix = suffix.substr(natural.length).trim()
          const match = locatorRE.exec(retValue.suffix)
          if (match !== null) {
            retValue.locator = match[0] // Extract the full match
            retValue.suffix = retValue.suffix.substr(match[0].length).trim()
          }
        }

        return retValue // Early exit
      }
    }
  }

  // If we're here, there was no explicit label given, but the caller has indicated
  // that this suffix MUST contain a locator. This means that the whole suffix is
  // the locator.
  if (containsLocator) {
    retValue.locator = suffix
  } else {
    // The caller has not indicated that the whole suffix is the locator, so it
    // can be at the beginning. We only accept simple page/number ranges here.
    // For everything, the user should please be more specific.
    const match = locatorRE.exec(suffix)
    if (match !== null) {
      retValue.locator = match[0] // Full match is the locator
      retValue.suffix = suffix.substr(match[0].length).trim() // The rest is the suffix.
    }
  }

  return retValue
}
