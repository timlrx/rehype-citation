import { plugins } from '../core/index.js'
import { ref, formats as input } from './input/index.js'
import config from './config.js'
import output from './output/index.js'
plugins.add(ref, {
  input,
  output,
  config,
})
