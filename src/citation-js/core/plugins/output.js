import Register from '../util/register.js'
function validate(name, formatter) {
  if (typeof name !== 'string') {
    throw new TypeError(`Invalid output format name, expected string, got ${typeof name}`)
  } else if (typeof formatter !== 'function') {
    throw new TypeError(`Invalid formatter, expected function, got ${typeof formatter}`)
  }
}
export const register = new Register()
export function add(name, formatter) {
  validate(name, formatter)
  register.set(name, formatter)
}
export function remove(name) {
  register.remove(name)
}
export function has(name) {
  return register.has(name)
}
export function list() {
  return register.list()
}
export function format(name, data, ...options) {
  if (!register.has(name)) {
    throw new Error(`Output format "${name}" unavailable`)
  }
  return register.get(name)(data, ...options)
}
