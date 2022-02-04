import { util } from '../core/index.js'
import defaultTemplates from './styles.json'
const templates = new util.Register(defaultTemplates)

const fetchStyle = (style) => {
  if (templates.has(style)) {
    return templates.get(style)
  } else {
    return templates.get('apa')
  }
}

export default fetchStyle
export { templates }
