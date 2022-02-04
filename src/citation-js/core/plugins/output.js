import Register from '../util/register.js'

const validate = (name, formatter) => {
  if (typeof name !== 'string') {
    throw new TypeError(`Invalid output format name, expected string, got ${typeof name}`)
  } else if (typeof formatter !== 'function') {
    throw new TypeError(`Invalid formatter, expected function, got ${typeof formatter}`)
  }
}

export const register = new Register()
export const add = (name, formatter) => {
  validate(name, formatter)
  register.set(name, formatter)
}
export const remove = (name) => {
  register.remove(name)
}
export const has = (name) => {
  return register.has(name)
}
export const list = () => {
  return register.list()
}
export const format = (name, data, ...options) => {
  if (!register.has(name)) {
    throw new Error(`Output format "${name}" unavailable`)
  }

  return register.get(name)(data, ...options)
}
