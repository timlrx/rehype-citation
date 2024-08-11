function _objectWithoutProperties(source, excluded) {
  if (source == null) return {}
  var target = _objectWithoutPropertiesLoose(source, excluded)
  var key, i
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source)
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i]
      if (excluded.indexOf(key) >= 0) continue
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue
      target[key] = source[key]
    }
  }
  return target
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {}
  var target = {}
  var sourceKeys = Object.keys(source)
  var key, i
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i]
    if (excluded.indexOf(key) >= 0) continue
    target[key] = source[key]
  }
  return target
}
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
import { TYPE, LABEL } from './shared.js'
import biblatex from './biblatex.js'
import bibtex from './bibtex.js'
import { crossref } from './crossref.js'
function _parse(input, spec) {
  const registry = {}
  for (const entry of input) {
    registry[entry.label] = entry
  }
  return input.map(({ type, label, properties }) =>
    spec.convertToTarget(
      _objectSpread(
        {
          [TYPE]: type,
          [LABEL]: label,
        },
        crossref(type, properties, registry)
      )
    )
  )
}
function _format(input, spec) {
  return input.map((entry) => {
    const _spec$convertToSource = spec.convertToSource(entry),
      { [TYPE]: type, [LABEL]: label } = _spec$convertToSource,
      properties = _objectWithoutProperties(
        _spec$convertToSource,
        [TYPE, LABEL].map(_toPropertyKey)
      )
    return {
      type,
      label,
      properties,
    }
  })
}
export function parseBibtex(input) {
  return _parse(input, bibtex)
}
export function formatBibtex(input) {
  return _format(input, bibtex)
}
export function parse(input) {
  return _parse(input, biblatex)
}
export function format(input) {
  return _format(input, biblatex)
}
