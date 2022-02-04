const configs = {}
export const add = (ref, config) => {
  configs[ref] = config
}
export const get = (ref) => configs[ref]
export const has = (ref) => Object.prototype.hasOwnProperty.call(configs, ref)
export const remove = (ref) => {
  delete configs[ref]
}
export const list = () => Object.keys(configs)
