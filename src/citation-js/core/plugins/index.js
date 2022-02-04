import * as input from './input/index.js'
import * as output from './output.js'
import * as dict from './dict.js'
import * as config from './config.js'
const registers = {
  input,
  output,
  dict,
  config,
}
const indices = {}
export const add = (ref, plugins = {}) => {
  const mainIndex = (indices[ref] = {})

  for (const type in plugins) {
    if (type === 'config') {
      mainIndex.config = {
        [ref]: plugins.config,
      }
      registers.config.add(ref, plugins.config)
      continue
    }

    const typeIndex = (mainIndex[type] = {})
    const typePlugins = plugins[type]

    for (const name in typePlugins) {
      const typePlugin = typePlugins[name]
      typeIndex[name] = true
      registers[type].add(name, typePlugin)
    }
  }
}
export const remove = (ref) => {
  const mainIndex = indices[ref]

  for (const type in mainIndex) {
    const typeIndex = mainIndex[type]

    for (const name in typeIndex) {
      registers[type].remove(name)
    }
  }

  delete indices[ref]
}
export const has = (ref) => ref in indices
export const list = () => Object.keys(indices)
export { input, output, dict, config }
