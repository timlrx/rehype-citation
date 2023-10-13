import { plugins, util } from '../core/index.js'
import { parse as parseDate } from '@citation-js/date'

import '../plugin-yaml/index.js'

/**
 * Format: Citation File Format (CFF) version 1.2.0
 * Spec: https://github.com/citation-file-format/citation-file-format/blob/1.2.0/schema-guide.md
 */

const TYPES_TO_TARGET = {
  art: 'graphic',
  article: 'article-journal', // more likely
  audiovisual: 'motion_picture',
  bill: 'bill',
  blog: 'post-weblog',
  book: 'book',
  catalogue: 'collection',
  conference: 'event',
  'conference-paper': 'paper-conference',
  data: 'dataset',
  database: 'dataset',
  dictionary: 'entry-dictionary',
  'edited-work': 'document', // unmapped
  encyclopedia: 'entry-encyclopedia',
  'film-broadcast': 'broadcast',
  generic: 'document',
  'government-document': 'regulation',
  grant: 'document', // unmapped
  hearing: 'hearing',
  'historical-work': 'classic',
  'legal-case': 'legal_case',
  'legal-rule': 'legislation',
  'magazine-article': 'article-magazine',
  manual: 'report', // substitute presented in the CSL specification
  map: 'map',
  multimedia: 'motion_picture',
  music: 'musical_score',
  'newspaper-article': 'article-newspaper',
  pamphlet: 'pamphlet',
  patent: 'patent',
  'personal-communication': 'personal_communication',
  proceedings: 'book', // substitute presented in the CSL specification
  report: 'report',
  serial: 'periodical',
  slides: 'speech',
  software: 'software',
  'software-code': 'software',
  'software-container': 'software',
  'software-executable': 'software',
  'software-virtual-machine': 'software',
  'sound-recording': 'song',
  standard: 'standard',
  statute: 'legislation',
  thesis: 'thesis',
  unpublished: 'article',
  video: 'motion_picture',
  website: 'webpage',
}

const TYPES_TO_SOURCE = {
  article: 'article',
  'article-journal': 'article',
  'article-magazine': 'magazine-article',
  'article-newspaper': 'newspaper-article',
  bill: 'bill',
  book: 'book',
  broadcast: 'film-broadcast',
  chapter: 'generic', // unmapped
  classic: 'historical-work',
  collection: 'catalogue',
  dataset: 'data',
  document: 'generic',
  entry: 'generic', // unmapped
  'entry-dictionary': 'dictionary',
  'entry-encyclopedia': 'encyclopedia',
  event: 'conference',
  figure: 'generic', // unmapped
  graphic: 'art',
  hearing: 'hearing',
  interview: 'sound-recording',
  legal_case: 'legal-case',
  legislation: 'statute',
  manuscript: 'historical-work',
  map: 'map',
  motion_picture: 'film-broadcast',
  musical_score: 'music',
  pamphlet: 'pamphlet',
  'paper-conference': 'conference-paper',
  patent: 'patent',
  performance: 'generic', // unmapped
  periodical: 'serial',
  personal_communication: 'personal-communication',
  post: 'serial',
  'post-weblog': 'blog',
  regulation: 'government-document',
  report: 'report',
  review: 'generic', // unmapped
  'review-book': 'generic', // unmapped
  software: 'software',
  song: 'sound-recording',
  speech: 'slides',
  standard: 'standard',
  thesis: 'thesis',
  treaty: 'generic',
  webpage: 'website',
}

const ENTITY_PROPS = [
  { source: 'family-names', target: 'family' },
  { source: 'given-names', target: 'given' },
  { source: 'name-particle', target: 'non-dropping-particle' },
  { source: 'name-suffix', target: 'suffix' },
  { source: 'name', target: 'literal' },
  { source: 'orcid', target: '_orcid' },
]

const entity = new util.Translator(ENTITY_PROPS)

const PROP_CONVERTERS = {
  names: {
    toTarget(names) {
      return names.map(entity.convertToTarget)
    },
    toSource(names) {
      return names.map(entity.convertToSource)
    },
  },
  publisher: {
    toTarget({ name, city, region, country }) {
      const place = [city, region, country].filter(Boolean).join(', ')
      return [name, place || undefined]
    },
    toSource(name, place) {
      const entity = { name }

      if (place) {
        // Parse the following:
        //   - Country
        //   - City, Country
        //   - City, Region, Country
        const parts = place.split(', ')
        entity.country = parts.pop()
        if (parts.length === 2) {
          entity.region = parts.pop()
        }
        if (parts.length === 1) {
          entity.city = parts.pop()
        }
      }

      return entity
    },
  },
  date: {
    toTarget(date) {
      return parseDate(date.toISOString())
    },
    toSource(date) {
      if (date.raw) {
        return date.raw
      }
      const [year, month, day] = date['date-parts'][0]
      if (day) {
        return new Date(Date.UTC(year, month - 1, day))
      } else if (month) {
        return new Date(Date.UTC(year, month - 1))
      } else {
        return new Date(Date.UTC(year))
      }
    },
  },
}

const SHARED_PROPS = [
  'abstract',

  { source: 'authors', target: 'author', convert: PROP_CONVERTERS.names },

  // TODO cff: commit

  // TODO cff: contact

  {
    source: 'date-released',
    target: 'issued',
    when: { target: { type: 'software' } },
    convert: PROP_CONVERTERS.date,
  },

  { source: 'doi', target: 'DOI' },

  {
    source: 'identifiers',
    target: ['DOI', 'ISBN', 'ISSN', 'PMCID', 'PMID', 'URL'],
    convert: {
      toTarget(identifiers) {
        const newIdentifiers = Array(6).fill(undefined)
        for (const { type, value } of identifiers) {
          if (!this.doi && type === 'doi') {
            newIdentifiers[0] = value
          }
          if (!this.url && type === 'url') {
            newIdentifiers[5] = value
          }
          if (type === 'other' && value.startsWith('urn:isbn:')) {
            newIdentifiers[1] = value.slice(9)
          }
          if (type === 'other' && value.startsWith('urn:issn:')) {
            newIdentifiers[2] = value.slice(9)
          }
          if (type === 'other' && value.startsWith('pmcid:')) {
            newIdentifiers[3] = value.slice(6)
          }
          if (type === 'other' && value.startsWith('pmid:')) {
            newIdentifiers[4] = value.slice(5)
          }
        }
        return newIdentifiers
      },
      toSource(doi, isbn, issn, pmcid, pmid, url) {
        return [
          doi && { type: 'doi', value: doi },
          url && { type: 'url', value: url },

          isbn && { type: 'other', value: `urn:isbn:${isbn}` },
          issn && { type: 'other', value: `urn:issn:${issn}` },
          pmcid && { type: 'other', value: `pmcid:${pmcid}` },
          pmid && { type: 'other', value: `pmid:${pmid}` },
        ].filter(Boolean)
      },
    },
  },

  {
    source: 'keywords',
    target: 'keyword',
    convert: {
      toTarget(keywords) {
        return keywords.join(',')
      },
      toSource(keywords) {
        return keywords.split(/,\s*/g)
      },
    },
  },

  // TODO cff: license
  // TODO cff: license-url

  // TODO cff: message *

  // TODO cff: repository
  // TODO cff: repository-code
  // TODO cff: repository-artifact

  {
    source: 'title',
    target: 'title',
    when: {
      source: { term: false, entry: false },
      target: {
        type(type) {
          return !['entry', 'entry-dictionary', 'entry-encyclopedia'].includes(type)
        },
      },
    },
  },

  {
    source: 'title',
    target: 'container-title',
    when: {
      source: { entry: true, journal: false },
      target: { type: ['entry'] },
    },
  },

  {
    source: 'title',
    target: 'container-title',
    when: {
      source: { term: true, journal: false },
      target: { type: ['entry-dictionary', 'entry-encyclopedia'] },
    },
  },

  { source: 'url', target: 'URL' },

  'version',
]

const MAIN_PROPS = [
  // TYPES
  {
    source: 'type',
    target: 'type',
    convert: {
      toSource(type) {
        return type === 'dataset' ? 'dataset' : 'software'
      },
      toTarget(type) {
        return type === 'dataset' ? 'dataset' : 'software'
      },
    },
  },

  // Include main mappings
  ...SHARED_PROPS,
]

const REF_PROPS = [
  // Include main mappings
  ...SHARED_PROPS,

  // ABBREVIATION
  { source: 'abbreviation', target: 'title-short' },
  { source: 'abbreviation', target: 'shortTitle' },

  // COLLECTIONS
  // TODO cff: collection-doi
  // TODO cff: collection-type
  'collection-title',

  // COMMUNICATION
  { source: 'recipients', target: 'recipient', convert: PROP_CONVERTERS.names },
  { source: 'senders', target: 'authors', convert: PROP_CONVERTERS.names },

  // CONFERENCE
  {
    source: 'conference',
    target: ['event-title', 'event-date', 'event-place', 'event'],
    convert: {
      toSource(name, date, place, nameFallback) {
        const entity = { name: name || nameFallback }

        if (place) {
          entity.location = place
        }
        if (date) {
          entity['date-start'] = PROP_CONVERTERS.date.toSource(date)

          if (date['date-parts'] && date['date-parts'].length === 2) {
            entity['date-end'] = PROP_CONVERTERS.date.toSource({
              'date-parts': [date['date-parts'][1]],
            })
          }
        }

        return entity
      },
      toTarget(event) {
        return [
          event.name,
          parseDate(event['date-start'].toISOString(), event['date-end'].toISOString()),
          event.location,
        ]
      },
    },
  },

  // COPYRIGHT
  // TODO cff: contact
  // TODO cff: copyright

  // DATABASE
  { source: 'database', target: 'source' },
  // TODO cff: database-provider NOTE entity

  // DATE
  { source: 'date-accessed', target: 'accessed', convert: PROP_CONVERTERS.date },

  {
    source: 'date-downloaded',
    target: 'accessed',
    convert: PROP_CONVERTERS.date,
    when: { source: { 'date-accessed': false }, target: false },
  },

  {
    source: 'date-published',
    target: 'issued',
    convert: PROP_CONVERTERS.date,
    when: {
      source: { 'date-released': false },
      target() {
        return this.type !== 'book' || !this.version
      },
    },
  },

  {
    source: ['year', 'month'],
    target: 'issued',
    when: { source: { 'date-published': false, 'date-released': false, year: true } },
    convert: {
      toTarget(year, month) {
        const date = month ? [year, month] : [year]
        return { 'date-parts': [date] }
      },
      toSource(issued) {
        const [year, month] = issued['date-parts'][0]
        return [year, month]
      },
    },
  },

  {
    source: 'year-original',
    target: 'original-date',
    convert: {
      toTarget(year) {
        return { 'date-parts': [[year]] }
      },
      toSource(date) {
        return date['date-parts'][0][0]
      },
    },
  },

  // EDITION
  'edition',

  // EDITORS
  { source: 'editors', target: 'editor', convert: PROP_CONVERTERS.names },
  { source: 'editors-series', target: 'collection-editor', convert: PROP_CONVERTERS.names },

  // ENTRY
  {
    source: 'entry',
    target: 'title',
    when: {
      source: { term: false },
      target: { type: 'entry' },
    },
  },
  {
    source: 'term',
    target: 'title',
    when: {
      target: { type: ['entry-dictionary', 'entry-encyclopedia'] },
    },
  },

  // FORMAT
  { source: 'format', target: 'dimensions' },
  'medium',

  // GENRE
  {
    source: 'data-type',
    target: 'genre',
    when: {
      target: {
        type(type) {
          return type !== 'thesis'
        },
      },
    },
  },
  {
    source: 'thesis-type',
    target: 'genre',
    when: {
      source: { 'data-type': false },
      target: { type: 'thesis' },
    },
  },

  // IDENTIFIERS
  { source: 'isbn', target: 'ISBN' },
  { source: 'issn', target: 'ISSN' },
  // TODO cff: nihmsid
  { source: 'pmcid', target: 'PMCID' },

  // ISSUE
  'issue',

  // JOURNAL
  { source: 'journal', target: 'container-title' },
  { source: 'volume-title', target: 'volume-title' },
  {
    source: 'issue-title',
    target: 'volume-title',
    when: {
      source: { 'volume-title': false },
      target: false,
    },
  },
  // TODO cff: issue-date

  // LANGUAGE
  {
    source: 'languages',
    target: 'language',
    when: {
      target: true,
      // NOTE: possible values not as strict in csl, so test (crudely) if the value is ok first
      source: {
        language(code) {
          return /[a-z]{2,3}/.test(code)
        },
      },
    },
    convert: {
      // NOTE: CSL can only hold one language
      toSource(language) {
        return [language]
      },
      toTarget(languages) {
        return languages[0]
      },
    },
  },

  // LOCATION
  {
    source: 'location',
    target: ['archive', 'archive-place'],
    convert: PROP_CONVERTERS.publisher,
  },

  // LOCATION (CODE)
  // TODO cff: filename
  // TODO cff: loc-start
  // TODO cff: loc-end

  // NOTES
  { source: 'notes', target: 'note', when: { source: { scope: false } } },
  { source: 'scope', target: 'note', when: { target: false } },

  // NUMBER
  'number',

  // PATENT
  {
    source: 'patent-states',
    target: 'jurisdiction',
    // NOTE: CSL jurisdiction can contain more than just US states
    when: { target: false },
    convert: {
      toTarget(states) {
        return states.join(', ')
      },
    },
  },

  // PUBLISHER
  {
    source: ['institution', 'department'],
    target: ['publisher', 'publisher-place'],
    when: { source: { publisher: false }, target: { type: 'thesis' } },
    convert: {
      toTarget(institution, department) {
        const [name, place] = PROP_CONVERTERS.publisher.toTarget(institution)
        return [department ? `${department}, ${name}` : name, place]
      },
      toSource(name, place) {
        return [PROP_CONVERTERS.publisher.toSource(name, place)]
      },
    },
  },
  {
    source: 'publisher',
    target: ['publisher', 'publisher-place'],
    when: {
      target: {
        type(type) {
          return type !== 'thesis'
        },
      },
    },
    convert: PROP_CONVERTERS.publisher,
  },

  // SECTION
  'section',

  // STATUS
  {
    source: 'status',
    target: 'status',
    when: {
      source: true,
      // NOTE: possible values not as strict in csl, so test if the value is ok first
      target: {
        status: [
          'in-preparation',
          'abstract',
          'submitted',
          'in-press',
          'advance-online',
          'preprint',
        ],
      },
    },
  },

  // PAGES
  { source: 'start', target: 'page-first', when: { target: { page: false } } },
  {
    source: ['start', 'end'],
    target: 'page',
    convert: {
      toTarget(start, end) {
        return end ? `${start}-${end}` : start
      },
      toSource(page) {
        const [start, end] = page.split('-')
        return end ? [start, end] : [start]
      },
    },
  },
  { source: 'pages', target: 'number-of-pages' },

  // TRANSLATORS
  { source: 'translators', target: 'translator', convert: PROP_CONVERTERS.names },

  // TYPES
  {
    source: 'type',
    target: 'type',
    convert: {
      toTarget(type) {
        return TYPES_TO_TARGET[type] || 'document'
      },
      toSource(type) {
        if (type === 'book' && this['event-title']) {
          return 'proceedings'
        }
        return TYPES_TO_SOURCE[type] || 'generic'
      },
    },
  },

  // VOLUMES
  'volume',
  { source: 'number-volumes', target: 'number-of-volumes' },
]

const mainTranslator = new util.Translator(MAIN_PROPS)
const refTranslator = new util.Translator(REF_PROPS)
const CFF_VERSION = '1.2.0'

/** Add doi or url as unique id if available to make citation easy */
function addId(entry) {
  if ('DOI' in entry) {
    entry.id = entry.DOI
  } else if ('URL' in entry) {
    entry.id = entry.URL.replace('http://', '').replace('https://', '')
  }
}

function parse(input) {
  const main = mainTranslator.convertToTarget(input)
  if (input['cff-version'] <= '1.1.0') {
    main.type = TYPES_TO_TARGET.software
  }
  main._cff_mainReference = true
  addId(main)

  const output = [main]
  if (input['preferred-citation']) {
    const preferredCitation = refTranslator.convertToTarget(input['preferred-citation'])
    addId(preferredCitation)
    output.push(preferredCitation)
  }

  if (Array.isArray(input.references)) {
    output.push(...input.references.map(refTranslator.convertToTarget))
  }

  return output
}

function format(input, options = {}) {
  input = input.slice()
  const {
    main,
    preferred,
    cffVersion = CFF_VERSION,
    message = 'Please cite the following works when using this software.',
  } = options

  let preferredCitation
  const preferredIndex = input.findIndex((entry) => preferred && entry.id === preferred)
  if (cffVersion >= '1.2.0' && preferredIndex > -1) {
    preferredCitation = refTranslator.convertToSource(...input.splice(preferredIndex, 1))
  }

  let mainIndex = input.findIndex((entry) => (main ? entry.id === main : entry._cff_mainReference))
  mainIndex = mainIndex > -1 ? mainIndex : 0
  const mainRef = input[mainIndex]
    ? mainTranslator.convertToSource(...input.splice(mainIndex, 1))
    : {}
  if (mainRef && cffVersion < '1.2.0') {
    delete mainRef.type
  }

  const cff = { 'cff-version': cffVersion, message, ...mainRef }

  if (preferredCitation) {
    cff['preferred-citation'] = preferredCitation
  }

  if (input.length) {
    cff.references = input.map(refTranslator.convertToSource)
  }

  return cff
}

plugins.add('@cff', {
  input: {
    '@cff/object': {
      parseType: {
        dataType: 'SimpleObject',
        propertyConstraint: {
          props: 'cff-version',
        },
      },
      parse,
    },
  },
  output: {
    cff(data, options = {}) {
      const output = format(data, options)
      if (options.type === 'object') {
        return output
      } else {
        return plugins.output.format('yaml', output)
      }
    },
  },
})
