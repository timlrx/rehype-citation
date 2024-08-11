const configs = {}
export function add(ref, config) {
  configs[ref] = config
}
export function get(ref) {
  return configs[ref]
}
export function has(ref) {
  return Object.prototype.hasOwnProperty.call(configs, ref)
}
export function remove(ref) {
  delete configs[ref]
}
export function list() {
  return Object.keys(configs)
}
