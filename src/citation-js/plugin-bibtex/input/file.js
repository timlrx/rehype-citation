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
import { util, logger } from '../../core/index.js'
import moo from 'moo'
import config from '../config.js'
import { defaultStrings } from './constants.js'
const identifier = /[a-zA-Z_][a-zA-Z0-9_:+-]*/
const whitespace = {
  comment: /%.*/,
  whitespace: {
    match: /\s+/,
    lineBreaks: true,
  },
}
const lexer = moo.states({
  main: {
    junk: {
      match: /@[cC][oO][mM][mM][eE][nN][tT].+|[^@]+/,
      lineBreaks: true,
    },
    at: {
      match: '@',
      push: 'entry',
    },
  },
  entry: _objectSpread(
    _objectSpread({}, whitespace),
    {},
    {
      otherEntryType: {
        match: /[sS][tT][rR][iI][nN][gG]|[pP][rR][eE][aA][mM][bB][lL][eE]/,
        next: 'otherEntryContents',
      },
      dataEntryType: {
        match: identifier,
        next: 'dataEntryContents',
      },
    }
  ),
  otherEntryContents: _objectSpread(
    _objectSpread({}, whitespace),
    {},
    {
      lbrace: {
        match: /[{(]/,
        next: 'fields',
      },
    }
  ),
  dataEntryContents: _objectSpread(
    _objectSpread({}, whitespace),
    {},
    {
      lbrace: {
        match: /[{(]/,
        next: 'dataEntryContents',
      },
      label: /[^,\s]+/,
      comma: {
        match: ',',
        next: 'fields',
      },
    }
  ),
  fields: _objectSpread(
    _objectSpread({}, whitespace),
    {},
    {
      identifier,
      number: /-?\d+/,
      hash: '#',
      equals: '=',
      comma: ',',
      quote: {
        match: '"',
        push: 'quotedLiteral',
      },
      lbrace: {
        match: '{',
        push: 'bracedLiteral',
      },
      rbrace: {
        match: /[})]/,
        pop: true,
      },
    }
  ),
  quotedLiteral: {
    lbrace: {
      match: '{',
      push: 'bracedLiteral',
    },
    quote: {
      match: '"',
      pop: true,
    },
    text: {
      match: /(?:\\[\\{]|[^{"])+/,
      lineBreaks: true,
    },
  },
  bracedLiteral: {
    lbrace: {
      match: '{',
      push: 'bracedLiteral',
    },
    rbrace: {
      match: '}',
      pop: true,
    },
    text: {
      match: /(?:\\[\\{}]|[^{}])+/,
      lineBreaks: true,
    },
  },
})
const delimiters = {
  '(': ')',
  '{': '}',
}
export const bibtexGrammar = new util.Grammar(
  {
    Main() {
      const entries = []
      while (true) {
        while (this.matchToken('junk')) {
          this.consumeToken('junk')
        }
        if (this.matchEndOfFile()) {
          break
        }
        entries.push(this.consumeRule('Entry'))
      }
      return entries.filter(Boolean)
    },
    _() {
      let oldToken
      while (oldToken !== this.token) {
        oldToken = this.token
        this.consumeToken('whitespace', true)
        this.consumeToken('comment', true)
      }
    },
    Entry() {
      this.consumeToken('at')
      this.consumeRule('_')
      const type = (
        this.matchToken('otherEntryType')
          ? this.consumeToken('otherEntryType')
          : this.consumeToken('dataEntryType')
      ).value.toLowerCase()
      this.consumeRule('_')
      const openBrace = this.consumeToken('lbrace').value
      this.consumeRule('_')
      let result
      if (type === 'string') {
        const [key, value] = this.consumeRule('Field')
        this.state.strings[key] = value
      } else if (type === 'preamble') {
        this.consumeRule('Expression')
      } else {
        const label = this.consumeToken('label').value
        this.consumeRule('_')
        this.consumeToken('comma')
        this.consumeRule('_')
        const entryBody = this.consumeRule('EntryBody')
        result = _objectSpread(
          {
            type,
            label,
          },
          entryBody
        )
      }
      this.consumeRule('_')
      const closeBrace = this.consumeToken('rbrace').value
      if (closeBrace !== delimiters[openBrace]) {
        logger.warn(
          '[plugin-bibtex]',
          `entry started with "${openBrace}", but ends with "${closeBrace}"`
        )
      }
      return result
    },
    EntryBody() {
      const output = {
        properties: {},
      }
      while (this.matchToken('identifier')) {
        const [field, value] = this.consumeRule('Field')
        let annotationField
        let annotationName = 'default'
        if (field.endsWith(config.biber.annotationMarker)) {
          annotationField = field.slice(0, -config.biber.annotationMarker.length)
        } else if (
          field.includes(config.biber.annotationMarker + config.biber.namedAnnotationMarker)
        ) {
          ;[annotationField, annotationName] = field.split(
            config.biber.annotationMarker + config.biber.namedAnnotationMarker
          )
        }
        if (annotationField) {
          if (!output.annotations) {
            output.annotations = {}
          }
          if (!output.annotations[annotationField]) {
            output.annotations[annotationField] = {}
          }
          output.annotations[annotationField][annotationName] = value
        } else {
          output.properties[field] = value
        }
        this.consumeRule('_')
        if (this.consumeToken('comma', true)) {
          this.consumeRule('_')
        } else {
          break
        }
      }
      return output
    },
    Field() {
      const field = this.consumeToken('identifier').value.toLowerCase()
      this.consumeRule('_')
      this.consumeToken('equals')
      this.consumeRule('_')
      const value = this.consumeRule('Expression')
      return [field, value]
    },
    Expression() {
      let output = this.consumeRule('ExpressionPart')
      this.consumeRule('_')
      while (this.matchToken('hash')) {
        this.consumeToken('hash')
        this.consumeRule('_')
        output += this.consumeRule('ExpressionPart').toString()
        this.consumeRule('_')
      }
      return output
    },
    ExpressionPart() {
      if (this.matchToken('identifier')) {
        return this.state.strings[this.consumeToken('identifier').value.toLowerCase()] || ''
      } else if (this.matchToken('number')) {
        return parseInt(this.consumeToken('number'))
      } else if (this.matchToken('quote')) {
        return this.consumeRule('QuoteString')
      } else {
        return this.consumeRule('BracketString')
      }
    },
    QuoteString() {
      let output = ''
      this.consumeToken('quote')
      while (!this.matchToken('quote')) {
        output += this.consumeRule('Text')
      }
      this.consumeToken('quote')
      return output
    },
    BracketString() {
      let output = ''
      this.consumeToken('lbrace')
      while (!this.matchToken('rbrace')) {
        output += this.consumeRule('Text')
      }
      this.consumeToken('rbrace')
      return output
    },
    Text() {
      if (this.matchToken('lbrace')) {
        return `{${this.consumeRule('BracketString')}}`
      } else {
        return this.consumeToken('text').value
      }
    },
  },
  {
    strings: defaultStrings,
  }
)
export function parse(text) {
  return bibtexGrammar.parse(lexer.reset(text))
}
