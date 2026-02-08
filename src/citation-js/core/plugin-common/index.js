import * as plugins from '../plugins/index.js'
import { ref, formats as input } from './input/index.js'
import output from './output/index.js'
plugins.add(ref, {
  input,
  output,
})
