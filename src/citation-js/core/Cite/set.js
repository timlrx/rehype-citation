//@ts-nocheck
import { chain as parseInput, chainAsync as parseInputAsync } from '../plugins/input/index.js'
import fetchId from '../util/fetchId.js'

const add = function (data, options = {}, log = false) {
  if (options === true || log === true) {
    this.save()
  }

  this.data.push(...parseInput(data, options))
  this.data
    .filter((entry) => !Object.prototype.hasOwnProperty.call(entry, 'id'))
    .forEach((entry) => {
      entry.id = fetchId(this.getIds(), 'temp_id_')
    })
  return this
}

const addAsync = async function (data, options = {}, log = false) {
  if (options === true || log === true) {
    this.save()
  }

  this.data.push(...(await parseInputAsync(data, options)))
  this.data
    .filter((entry) => !Object.prototype.hasOwnProperty.call(entry, 'id'))
    .forEach((entry) => {
      entry.id = fetchId(this.getIds(), 'temp_id_')
    })
  return this
}

/** @type {{set: Function}} */
const set = function (data, options = {}, log = false) {
  if (options === true || log === true) {
    this.save()
  }

  this.data = []
  return typeof options !== 'boolean' ? this.add(data, options) : this.add(data)
}

/** @type {{setAsync: Function}} */
const setAsync = async function (data, options = {}, log = false) {
  if (options === true || log === true) {
    this.save()
  }

  this.data = []
  return typeof options !== 'boolean' ? this.addAsync(data, options) : this.addAsync(data)
}

/** @type {{reset: Function}} */
const reset = function (log) {
  if (log) {
    this.save()
  }

  this.data = []
  this._options = {}
  return this
}

export { add, addAsync, set, setAsync, reset }
