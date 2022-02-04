function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object)
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object)
    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable
      })
    }
    keys.push.apply(keys, symbols)
  }
  return keys
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {}
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key])
      })
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
      })
    }
  }
  return target
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  } else {
    obj[key] = value
  }
  return obj
}

import { parse as parseName } from '@citation-js/name'
const NAME = 1
const NAME_LIST = 2
const DATE = 3
const TYPE = 4
const entryTypes = {
  article: true,
  'article-journal': true,
  'article-magazine': true,
  'article-newspaper': true,
  bill: true,
  book: true,
  broadcast: true,
  chapter: true,
  classic: true,
  collection: true,
  dataset: true,
  document: true,
  entry: true,
  'entry-dictionary': true,
  'entry-encyclopedia': true,
  event: true,
  figure: true,
  graphic: true,
  hearing: true,
  interview: true,
  legal_case: true,
  legislation: true,
  manuscript: true,
  map: true,
  motion_picture: true,
  musical_score: true,
  pamphlet: true,
  'paper-conference': true,
  patent: true,
  performance: true,
  periodical: true,
  personal_communication: true,
  post: true,
  'post-weblog': true,
  regulation: true,
  report: true,
  review: true,
  'review-book': true,
  software: true,
  song: true,
  speech: true,
  standard: true,
  thesis: true,
  treaty: true,
  webpage: true,
  'journal-article': 'article-journal',
  'book-chapter': 'chapter',
  'posted-content': 'manuscript',
  'proceedings-article': 'paper-conference',
}
const fieldTypes = {
  author: NAME_LIST,
  'collection-editor': NAME_LIST,
  composer: NAME_LIST,
  'container-author': NAME_LIST,
  editor: NAME_LIST,
  'editorial-director': NAME_LIST,
  director: NAME_LIST,
  interviewer: NAME_LIST,
  illustrator: NAME_LIST,
  'original-author': NAME_LIST,
  'reviewed-author': NAME_LIST,
  recipient: NAME_LIST,
  translator: NAME_LIST,
  accessed: DATE,
  container: DATE,
  'event-date': DATE,
  issued: DATE,
  'original-date': DATE,
  submitted: DATE,
  type: TYPE,
  categories: 'object',
  id: ['string', 'number'],
  language: 'string',
  journalAbbreviation: 'string',
  shortTitle: 'string',
  abstract: 'string',
  annote: 'string',
  archive: 'string',
  archive_location: 'string',
  'archive-place': 'string',
  authority: 'string',
  'call-number': 'string',
  'chapter-number': 'string',
  'citation-number': 'string',
  'citation-label': 'string',
  'collection-number': 'string',
  'collection-title': 'string',
  'container-title': 'string',
  'container-title-short': 'string',
  dimensions: 'string',
  DOI: 'string',
  edition: ['string', 'number'],
  event: 'string',
  'event-place': 'string',
  'first-reference-note-number': 'string',
  genre: 'string',
  ISBN: 'string',
  ISSN: 'string',
  issue: ['string', 'number'],
  jurisdiction: 'string',
  keyword: 'string',
  locator: 'string',
  medium: 'string',
  note: 'string',
  number: ['string', 'number'],
  'number-of-pages': 'string',
  'number-of-volumes': ['string', 'number'],
  'original-publisher': 'string',
  'original-publisher-place': 'string',
  'original-title': 'string',
  page: 'string',
  'page-first': 'string',
  PMCID: 'string',
  PMID: 'string',
  publisher: 'string',
  'publisher-place': 'string',
  references: 'string',
  'reviewed-title': 'string',
  scale: 'string',
  section: 'string',
  source: 'string',
  status: 'string',
  title: 'string',
  'title-short': 'string',
  URL: 'string',
  version: 'string',
  volume: ['string', 'number'],
  'year-suffix': 'string',
}

const correctName = function (name, bestGuessConversions) {
  if (typeof name === 'object' && name !== null && (name.literal || name.given || name.family)) {
    return name
  } else if (!bestGuessConversions) {
    return undefined
  } else if (typeof name === 'string') {
    return parseName(name)
  }
}

const correctNameList = function (nameList, bestGuessConversions) {
  if (nameList instanceof Array) {
    const names = nameList.map((name) => correctName(name, bestGuessConversions)).filter(Boolean)
    return names.length ? names : undefined
  }
}

const correctDateParts = function (dateParts, bestGuessConversions) {
  if (dateParts.every((part) => typeof part === 'number')) {
    return dateParts
  } else if (!bestGuessConversions || dateParts.some((part) => isNaN(parseInt(part)))) {
    return undefined
  } else {
    return dateParts.map((part) => parseInt(part))
  }
}

const correctDate = function (date, bestGuessConversions) {
  const dp = 'date-parts'

  if (typeof date !== 'object' || date === null) {
    return undefined
  } else if (date[dp] instanceof Array && date[dp].every((part) => part instanceof Array)) {
    const range = date[dp]
      .map((dateParts) => correctDateParts(dateParts, bestGuessConversions))
      .filter(Boolean)
    return range.length
      ? _objectSpread(
          _objectSpread({}, date),
          {},
          {
            'date-parts': range,
          }
        )
      : undefined
  } else if (date instanceof Array && date.every((part) => part[dp] instanceof Array)) {
    const range = date
      .map((dateParts) => correctDateParts(dateParts[dp], bestGuessConversions))
      .filter(Boolean)
    return range.length
      ? {
          'date-parts': range,
        }
      : undefined
  } else if (date[dp] instanceof Array) {
    const dateParts = correctDateParts(date[dp], bestGuessConversions)
    return (
      dateParts && {
        'date-parts': [dateParts],
      }
    )
  } else if ('literal' in date || 'raw' in date) {
    return date
  }
}

const correctType = function (type, bestGuessConversions) {
  type = correctField('language', type, bestGuessConversions)

  if (entryTypes[type] === true) {
    return type
  } else if (bestGuessConversions && type in entryTypes) {
    return entryTypes[type]
  } else {
    return undefined
  }
}

const correctField = function (fieldName, value, bestGuessConversions) {
  const fieldType = [].concat(fieldTypes[fieldName])

  switch (fieldTypes[fieldName]) {
    case NAME:
      return correctName(value, bestGuessConversions)

    case NAME_LIST:
      return correctNameList(value, bestGuessConversions)

    case DATE:
      return correctDate(value, bestGuessConversions)

    case TYPE:
      return correctType(value, bestGuessConversions)
  }

  if (/^_/.test(fieldName)) {
    return value
  } else if (bestGuessConversions) {
    if (
      typeof value === 'string' &&
      fieldType.includes('number') &&
      !fieldType.includes('string') &&
      !isNaN(+value)
    ) {
      return parseFloat(value)
    } else if (
      typeof value === 'number' &&
      fieldType.includes('string') &&
      !fieldType.includes('number')
    ) {
      return value.toString()
    } else if (Array.isArray(value) && value.length) {
      return correctField(fieldName, value[0], bestGuessConversions)
    }
  }

  if (fieldType.includes(typeof value)) {
    return value
  }
}

const parseCsl = function (data, bestGuessConversions = true) {
  return data.map(function (entry) {
    const clean = {}

    for (const field in entry) {
      const correction = correctField(field, entry[field], bestGuessConversions)

      if (correction !== undefined) {
        clean[field] = correction
      }
    }

    return clean
  })
}

export { parseCsl as clean }
