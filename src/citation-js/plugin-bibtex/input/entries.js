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
import config from '../config.js'
import { parse as mapBiblatex, parseBibtex as mapBibtex } from '../mapping/index.js'
import { parse as parseValue, parseAnnotation } from './value.js'
import { required } from './constants.js'
function validate(entries, requirements) {
  const problems = []
  for (const { type, label, properties } of entries) {
    if (type in requirements) {
      const missing = []
      for (const field of requirements[type]) {
        if (Array.isArray(field) && !field.some((field) => field in properties)) {
          missing.push(field.join('/'))
        } else if (typeof field === 'string' && !(field in properties)) {
          missing.push(field)
        }
      }
      if (missing.length) {
        problems.push([label, `missing fields: ${missing.join(', ')}`])
      }
    } else {
      problems.push([label, `invalid type: "${type}"`])
    }
  }
  if (problems.length) {
    throw new RangeError(
      ['Invalid entries:']
        .concat(problems.map(([label, problem]) => `  - ${label} has ${problem}`))
        .join('\n')
    )
  }
}
function parseEntryValues(entry) {
  const output = {}
  if ('language' in entry.properties) {
    output.language = parseValue(entry.properties.language, 'language')
  }
  for (const property in entry.properties) {
    const value = entry.properties[property]
    if (value === '') {
      continue
    }
    output[property] = parseValue(value + '', property, output.language)
  }
  for (const property in entry.annotations) {
    for (const annotation in entry.annotations[property]) {
      output[property + '+an:' + annotation] = parseAnnotation(
        entry.annotations[property][annotation]
      )
    }
  }
  return _objectSpread(
    _objectSpread({}, entry),
    {},
    {
      properties: output,
    }
  )
}
export function parse(entries) {
  if (config.parse.strict) {
    validate(entries, required.biblatex)
  }
  return mapBiblatex(entries.map(parseEntryValues))
}
export function parseBibtex(entries) {
  if (config.parse.strict) {
    validate(entries, required.bibtex)
  }
  return mapBibtex(entries.map(parseEntryValues))
}
