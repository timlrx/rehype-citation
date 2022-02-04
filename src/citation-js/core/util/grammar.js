import { deepCopy } from './deepCopy.js'

class Grammar {
  constructor(rules, state) {
    this.rules = rules
    this.defaultState = state
    this.mainRule = Object.keys(rules)[0]
    this.log = []
  }

  parse(iterator, mainRule) {
    this.lexer = iterator
    this.token = this.lexer.next()
    this.state = deepCopy(this.defaultState)
    this.log = []
    return this.consumeRule(mainRule || this.mainRule)
  }

  matchEndOfFile() {
    return !this.token
  }

  matchToken(type) {
    return this.token && type === this.token.type
  }

  consumeToken(type, optional) {
    const token = this.token

    if (!type || (token && token.type === type)) {
      this.token = this.lexer.next()
      return token
    } else if (optional) {
      return undefined
    } else {
      const got = token ? `"${token.type}"` : 'EOF'
      const error = new SyntaxError(this.lexer.formatError(token, `expected "${type}", got ${got}`))
      error.message += ` (${this.log.join('->')})`
      throw error
    }
  }

  consumeRule(rule) {
    this.log.push(rule)
    const result = this.rules[rule].call(this)
    this.log.pop()
    return result
  }
}

export { Grammar }
