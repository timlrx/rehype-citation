class TokenStack {
  constructor(array) {
    this.stack = array
    this.index = 0
    this.current = this.stack[this.index]
  }

  static getPatternText(pattern) {
    return `"${pattern instanceof RegExp ? pattern.source : pattern}"`
  }

  static getMatchCallback(pattern) {
    if (Array.isArray(pattern)) {
      const matches = pattern.map(TokenStack.getMatchCallback)
      return (token) => matches.some((matchCallback) => matchCallback(token))
    } else if (pattern instanceof Function) {
      return pattern
    } else if (pattern instanceof RegExp) {
      return (token) => pattern.test(token)
    } else {
      return (token) => pattern === token
    }
  }

  tokensLeft() {
    return this.stack.length - this.index
  }

  matches(pattern) {
    return TokenStack.getMatchCallback(pattern)(this.current, this.index, this.stack)
  }

  matchesSequence(sequence) {
    const part = this.stack.slice(this.index, this.index + sequence.length).join('')
    return typeof sequence === 'string'
      ? part === sequence
      : sequence.every((pattern, index) => TokenStack.getMatchCallback(pattern)(part[index]))
  }

  consumeToken(pattern = /^[\s\S]$/, { inverse = false, spaced = true } = {}) {
    if (spaced) {
      this.consumeWhitespace()
    }

    const token = this.current
    const match = TokenStack.getMatchCallback(pattern)(token, this.index, this.stack)

    if (match) {
      this.current = this.stack[++this.index]
    } else {
      throw new SyntaxError(
        `Unexpected token at index ${this.index}: Expected ${TokenStack.getPatternText(
          pattern
        )}, got "${token}"`
      )
    }

    if (spaced) {
      this.consumeWhitespace()
    }

    return token
  }

  consumeWhitespace(pattern = /^\s$/, { optional = true } = {}) {
    return this.consume(pattern, {
      min: +!optional,
    })
  }

  consumeN(length) {
    if (this.tokensLeft() < length) {
      throw new SyntaxError('Not enough tokens left')
    }

    const start = this.index

    while (length--) {
      this.current = this.stack[++this.index]
    }

    return this.stack.slice(start, this.index).join('')
  }

  consumeSequence(sequence) {
    if (this.matchesSequence(sequence)) {
      return this.consumeN(sequence.length)
    } else {
      throw new SyntaxError(`Expected "${sequence}", got "${this.consumeN(sequence.length)}"`)
    }
  }

  consume(
    pattern = /^[\s\S]$/,
    { min = 0, max = Infinity, inverse = false, tokenMap, tokenFilter } = {}
  ) {
    const start = this.index
    const match = TokenStack.getMatchCallback(pattern)

    while (match(this.current, this.index, this.stack) !== inverse) {
      this.current = this.stack[++this.index]
    }

    let consumed = this.stack.slice(start, this.index)

    if (consumed.length < min) {
      throw new SyntaxError(`Not enough ${TokenStack.getPatternText(pattern)}`)
    } else if (consumed.length > max) {
      throw new SyntaxError(`Too many ${TokenStack.getPatternText(pattern)}`)
    }

    if (tokenMap) {
      consumed = consumed.map(tokenMap)
    }

    if (tokenFilter) {
      consumed = consumed.filter(tokenFilter)
    }

    return consumed.join('')
  }
}

export default TokenStack
