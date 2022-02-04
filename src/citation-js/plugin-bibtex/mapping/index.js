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

function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, 'string')
  return typeof key === 'symbol' ? key : String(key)
}

function _toPrimitive(input, hint) {
  if (typeof input !== 'object' || input === null) return input
  var prim = input[Symbol.toPrimitive]
  if (prim !== undefined) {
    var res = prim.call(input, hint || 'default')
    if (typeof res !== 'object') return res
    throw new TypeError('@@toPrimitive must return a primitive value.')
  }
  return (hint === 'string' ? String : Number)(input)
}

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

import { TYPE, LABEL } from './shared.js'
import biblatex from './biblatex.js'
import bibtex from './bibtex.js'

function crossref(entry, registry) {
  if (entry.crossref in registry) {
    const parent = registry[entry.crossref].properties

    if (parent === entry) {
      return entry
    }

    return Object.assign({}, crossref(parent, registry), entry)
  }

  return entry
}

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
        crossref(properties, registry)
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
