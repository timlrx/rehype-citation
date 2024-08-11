// @ts-nocheck
import { deepCopy, upgradeCsl } from '../../util/index.js'
import logger from '../../logger.js'
import { get as getTypeInfo } from './register.js'
import { type as parseType } from './type.js'
import { data as parseData, dataAsync as parseDataAsync } from './data.js'
import { applyGraph, removeGraph } from './graph.js'
function prepareParseGraph(graph) {
  return graph
    .reduce((array, next) => {
      const last = array[array.length - 1]
      if (last && last.type === next.type) {
        last.count = last.count + 1 || 2
      } else {
        array.push(next)
      }
      return array
    }, [])
    .map((element) => (element.count > 1 ? element.count + 'x ' : '') + element.type)
    .join(' -> ')
}
class ChainParser {
  constructor(input, options = {}) {
    this.options = Object.assign(
      {
        generateGraph: true,
        forceType: parseType(input),
        maxChainLength: 10,
        strict: true,
        target: '@csl/list+object',
      },
      options
    )
    this.type = this.options.forceType
    this.data = typeof input === 'object' ? deepCopy(input) : input
    this.graph = [
      {
        type: this.type,
        data: input,
      },
    ]
    this.iteration = 0
  }
  iterate() {
    if (this.iteration !== 0) {
      const typeInfo = getTypeInfo(this.type)
      if (typeInfo && typeInfo.outputs) {
        this.type = typeInfo.outputs
      } else {
        this.type = parseType(this.data)
      }
      this.graph.push({
        type: this.type,
      })
    }
    if (this.error || this.type === this.options.target) {
      return false
    } else if (this.iteration >= this.options.maxChainLength) {
      this.error = new RangeError(
        `Max. number of parsing iterations reached (${prepareParseGraph(this.graph)})`
      )
      return false
    } else {
      this.iteration++
      return true
    }
  }
  end() {
    if (this.error) {
      logger.error('[core]', this.error.message)
      if (this.options.strict !== false) {
        throw this.error
      } else {
        return []
      }
    } else if (this.options.target === '@csl/list+object') {
      return upgradeCsl(this.data).map(
        this.options.generateGraph ? (entry) => applyGraph(entry, this.graph) : removeGraph
      )
    } else {
      return this.data
    }
  }
}
export const chain = (...args) => {
  const chain = new ChainParser(...args)
  while (chain.iterate()) {
    try {
      chain.data = parseData(chain.data, chain.type)
    } catch (e) {
      chain.error = e
    }
  }
  return chain.end()
}
export const chainLink = (input) => {
  const type = parseType(input)
  const output = type.match(/array|object/) ? deepCopy(input) : input
  return parseData(output, type)
}
export const chainAsync = async (...args) => {
  const chain = new ChainParser(...args)
  while (chain.iterate()) {
    chain.data = await parseDataAsync(chain.data, chain.type).catch((e) => {
      chain.error = e
    })
  }
  return chain.end()
}
export const chainLinkAsync = async (input) => {
  const type = parseType(input)
  const output = type.match(/array|object/) ? deepCopy(input) : input
  return parseDataAsync(output, type)
}
