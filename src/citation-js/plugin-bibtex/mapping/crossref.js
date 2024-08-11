function ownKeys(e, r) {
  var t = Object.keys(e)
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e)
    r &&
      (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable
      })),
      t.push.apply(t, o)
  }
  return t
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {}
    r % 2
      ? ownKeys(Object(t), !0).forEach(function (r) {
          _defineProperty(e, r, t[r])
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
      : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r))
        })
  }
  return e
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key)
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
function _toPropertyKey(t) {
  var i = _toPrimitive(t, 'string')
  return 'symbol' == typeof i ? i : i + ''
}
function _toPrimitive(t, r) {
  if ('object' != typeof t || !t) return t
  var e = t[Symbol.toPrimitive]
  if (void 0 !== e) {
    var i = e.call(t, r || 'default')
    if ('object' != typeof i) return i
    throw new TypeError('@@toPrimitive must return a primitive value.')
  }
  return ('string' === r ? String : Number)(t)
}
const BOOK = new Set(['book', 'inbook', 'bookinbook', 'suppbook'])
const BOOK_PART = new Set(['inbook', 'bookinbook', 'suppbook'])
const COLLECTION = new Set([
  'collection',
  'reference',
  'incollection',
  'inreference',
  'suppcollection',
])
const COLLECTION_PART = new Set(['incollection', 'inreference', 'suppcollection'])
const PROCEEDINGS = new Set(['proceedings', 'inproceedings'])
const PROCEEDINGS_PART = new Set(['inproceedings'])
const PERIODICAL_PART = new Set(['article', 'suppperiodical'])
const TITLE_MAP = {
  mvbook: ['main', BOOK],
  mvcollection: ['main', COLLECTION],
  mvreference: ['main', COLLECTION],
  mvproceedings: ['main', PROCEEDINGS],
  book: ['book', BOOK_PART],
  collection: ['book', COLLECTION_PART],
  reference: ['book', COLLECTION_PART],
  proceedings: ['book', PROCEEDINGS_PART],
  periodical: ['journal', PERIODICAL_PART],
}
export function crossref(target, entry, registry) {
  if (entry.crossref in registry) {
    const parent = registry[entry.crossref]
    if (parent.properties === entry) {
      return entry
    }
    const data = _objectSpread({}, crossref(parent.type, parent.properties, registry))
    delete data.ids
    delete data.crossref
    delete data.xref
    delete data.entryset
    delete data.entrysubtype
    delete data.execute
    delete data.label
    delete data.options
    delete data.presort
    delete data.related
    delete data.relatedoptions
    delete data.relatedstring
    delete data.relatedtype
    delete data.shortand
    delete data.shortandintro
    delete data.sortkey
    if ((parent.type === 'mvbook' || parent.type === 'book') && BOOK_PART.has(target)) {
      data.bookauthor = data.author
    }
    if (parent.type in TITLE_MAP) {
      const [prefix, targets] = TITLE_MAP[parent.type]
      if (targets.has(target)) {
        data[prefix + 'title'] = data.title
        data[prefix + 'subtitle'] = data.subtitle
        if (prefix !== 'journal') {
          data[prefix + 'titleaddon'] = data.titleaddon
        }
        delete data.title
        delete data.subtitle
        delete data.titleaddon
        delete data.shorttitle
        delete data.sorttitle
        delete data.indextitle
        delete data.indexsorttitle
      }
    }
    return Object.assign(data, entry)
  }
  return entry
}
