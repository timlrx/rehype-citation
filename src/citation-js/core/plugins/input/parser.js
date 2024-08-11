// @ts-nocheck
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
import { type, typeMatcher } from './type.js'
class TypeParser {
  constructor(data) {
    _defineProperty(this, 'validDataTypes', [
      'String',
      'Array',
      'SimpleObject',
      'ComplexObject',
      'Primitive',
    ])
    this.data = data
  }
  validateDataType() {
    const dataType = this.data.dataType
    if (dataType && !this.validDataTypes.includes(dataType)) {
      throw new RangeError(`dataType was ${dataType}; expected one of ${this.validDataTypes}`)
    }
  }
  validateParseType() {
    const predicate = this.data.predicate
    if (predicate && !(predicate instanceof RegExp || typeof predicate === 'function')) {
      throw new TypeError(`predicate was ${typeof predicate}; expected RegExp or function`)
    }
  }
  validateTokenList() {
    const tokenList = this.data.tokenList
    if (tokenList && typeof tokenList !== 'object') {
      throw new TypeError(`tokenList was ${typeof tokenList}; expected object or RegExp`)
    }
  }
  validatePropertyConstraint() {
    const propertyConstraint = this.data.propertyConstraint
    if (propertyConstraint && typeof propertyConstraint !== 'object') {
      throw new TypeError(
        `propertyConstraint was ${typeof propertyConstraint}; expected array or object`
      )
    }
  }
  validateElementConstraint() {
    const elementConstraint = this.data.elementConstraint
    if (elementConstraint && typeof elementConstraint !== 'string') {
      throw new TypeError(`elementConstraint was ${typeof elementConstraint}; expected string`)
    }
  }
  validateExtends() {
    const extend = this.data.extends
    if (extend && typeof extend !== 'string') {
      throw new TypeError(`extends was ${typeof extend}; expected string`)
    }
  }
  validate() {
    if (this.data === null || typeof this.data !== 'object') {
      throw new TypeError(`typeParser was ${typeof this.data}; expected object`)
    }
    this.validateDataType()
    this.validateParseType()
    this.validateTokenList()
    this.validatePropertyConstraint()
    this.validateElementConstraint()
    this.validateExtends()
  }
  parseTokenList() {
    let tokenList = this.data.tokenList
    if (!tokenList) {
      return []
    } else if (tokenList instanceof RegExp) {
      tokenList = {
        token: tokenList,
      }
    }
    const { token, split = /\s+/, trim = true, every = true } = tokenList
    const trimInput = (input) => (trim ? input.trim() : input)
    const testTokens = every ? 'every' : 'some'
    const predicate = (input) =>
      trimInput(input)
        .split(split)
        [testTokens]((part) => token.test(part))
    return [predicate]
  }
  parsePropertyConstraint() {
    const constraints = [].concat(this.data.propertyConstraint || [])
    return constraints.map(({ props, match, value }) => {
      props = [].concat(props)
      switch (match) {
        case 'any':
        case 'some':
          return (input) => props.some((prop) => prop in input && (!value || value(input[prop])))
        case 'none':
          return (input) => !props.some((prop) => prop in input && (!value || value(input[prop])))
        case 'every':
        default:
          return (input) => props.every((prop) => prop in input && (!value || value(input[prop])))
      }
    })
  }
  parseElementConstraint() {
    const constraint = this.data.elementConstraint
    return !constraint ? [] : [(input) => input.every((entry) => type(entry) === constraint)]
  }
  parsePredicate() {
    if (this.data.predicate instanceof RegExp) {
      return [this.data.predicate.test.bind(this.data.predicate)]
    } else if (this.data.predicate) {
      return [this.data.predicate]
    } else {
      return []
    }
  }
  getCombinedPredicate() {
    const predicates = [
      ...this.parsePredicate(),
      ...this.parseTokenList(),
      ...this.parsePropertyConstraint(),
      ...this.parseElementConstraint(),
    ]
    if (predicates.length === 0) {
      return () => true
    } else if (predicates.length === 1) {
      return predicates[0]
    } else {
      return (input) => predicates.every((predicate) => predicate(input))
    }
  }
  getDataType() {
    if (this.data.dataType) {
      return this.data.dataType
    } else if (this.data.predicate instanceof RegExp) {
      return 'String'
    } else if (this.data.tokenList) {
      return 'String'
    } else if (this.data.elementConstraint) {
      return 'Array'
    } else {
      return 'Primitive'
    }
  }
  get dataType() {
    return this.getDataType()
  }
  get predicate() {
    return this.getCombinedPredicate()
  }
  get extends() {
    return this.data.extends
  }
}
class DataParser {
  constructor(parser, { async } = {}) {
    this.parser = parser
    this.async = async
  }
  validate() {
    const parser = this.parser
    if (typeof parser !== 'function') {
      throw new TypeError(`parser was ${typeof parser}; expected function`)
    }
  }
}
class FormatParser {
  constructor(format, parsers = {}) {
    this.format = format
    if (parsers.parseType) {
      this.typeParser = new TypeParser(parsers.parseType)
    }
    if (parsers.parse) {
      this.dataParser = new DataParser(parsers.parse, {
        async: false,
      })
    }
    if (parsers.parseAsync) {
      this.asyncDataParser = new DataParser(parsers.parseAsync, {
        async: true,
      })
    }
  }
  validateFormat() {
    const format = this.format
    if (!typeMatcher.test(format)) {
      throw new TypeError(`format name was "${format}"; didn't match expected pattern`)
    }
  }
  validate() {
    this.validateFormat()
    if (this.typeParser) {
      this.typeParser.validate()
    }
    if (this.dataParser) {
      this.dataParser.validate()
    }
    if (this.asyncDataParser) {
      this.asyncDataParser.validate()
    }
  }
}
export { TypeParser, DataParser, FormatParser }
