import fetch from 'cross-fetch'

export const isNode = typeof window === 'undefined'

export const readFile = async (path) => {
  if (isValidHttpUrl(path)) {
    try {
      const response = await fetch(path)
      return await response.text()
    } catch (error) {
      throw new Error(`Cannot fetch bibliography URL: ${error}.`)
    }
  } else {
    if (isNode) {
      try {
        return import('fs').then((fs) => fs.readFileSync(path, 'utf8'))
      } catch (error) {
        throw new Error(`Cannot read non valid URL in node env.`)
      }
    }
  }
}

/**
 * Check if valid URL
 * https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
 *
 * @param {string} str
 * @return {boolean}
 */
export const isValidHttpUrl = (str, base = "") => {
  let url

  try {
    url = base ? new URL(str, base): new URL(str)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}

/**
 * Get bibliography by merging options and vfile data
 *
 * @param {import('./generator.js').Options} options
 * @param {import('vfile').VFile} file
 */
export const getBibliography = async (options, file) => {
  /** @type {string[]} */
  let bibliography = []
  const frontmatterBibliography = getFrontmatterField(file, 'bibliography')
  if (options.bibliography) {
    bibliography =
      typeof options.bibliography === 'string' ? [options.bibliography] : options.bibliography
  } else if (frontmatterBibliography) {
    bibliography =
      typeof frontmatterBibliography === 'string'
        ? [frontmatterBibliography]
        : frontmatterBibliography
  }
  // If local path, get absolute path
  for (let i = 0; i < bibliography.length; i++) {
    if (!isValidHttpUrl(bibliography[i], options.path)) {
      // Case options.path is provided and non empty
      if (options.path){
        // if node env we construct the full path using options.path
        if (isNode) {
          bibliography[i] = await import('path').then((path) =>
            path.join(options.path, bibliography[i])
          )
        // else we throw as it's non valid http url  
        } else {
          throw new Error(`Cannot read non valid bibliography URL.`) 
        }
      // Case options.path is empt
      } else {
        // if node env we construct the full path using default `process.cwd`
        if (isNode) {
          bibliography[i] = await import('path').then((path) =>
            path.join(file.cwd, bibliography[i])
          )
        // else as it's a non valid http url we throw as a base url must be provided using options.path
        } else {
          throw new Error(`Non valid bibliography URL: Provide a full valid path for biblio ${bibliography[i]} or set an appropriate "options.path"`)
        }
      }

    }
  }

  return bibliography
}

/**
 * Load CSL - supports predefined name from config.templates.data or http, file path (nodejs)
 *
 * @param {*} Cite cite object from citation-js
 * @param {string} format CSL name e.g. apa or file path to CSL file
 * @param {string} root optional root path
 */
export const loadCSL = async (Cite, format, root = '') => {
  const config = Cite.plugins.config.get('@csl')
  if (!Object.keys(config.templates.data).includes(format)) {
    const cslName = `customCSL-${Math.random().toString(36).slice(2, 7)}`
    let cslPath = ''
    if (isValidHttpUrl(format)) cslPath = format
    else {
      if (isNode) cslPath = await import('path').then((path) => path.join(root, format))
    }
    try {
      config.templates.add(cslName, await readFile(cslPath))
    } catch (err) {
      throw new Error(`Input CSL option, ${format}, is invalid or is an unknown file.`)
    }
    return cslName
  } else {
    return format
  }
}

/**
 * Load locale - supports predefined name from config.locales.data or http, file path (nodejs)
 *
 * @param {*} Cite cite object from citation-js
 * @param {string} format locale name
 * @param {string} root optional root path
 */
export const loadLocale = async (Cite, format, root = '') => {
  const config = Cite.plugins.config.get('@csl')
  if (!Object.keys(config.locales.data).includes(format)) {
    let localePath = ''
    if (isValidHttpUrl(format)) localePath = format
    else {
      if (isNode) localePath = await import('path').then((path) => path.join(root, format))
    }
    try {
      const file = await readFile(localePath)
      const xmlLangRe = /xml:lang="(.+)"/
      const localeName = file.match(xmlLangRe)[1]
      config.locales.add(localeName, file)
      return localeName
    } catch (err) {
      throw new Error(`Input locale option, ${format}, is invalid or is an unknown file.`)
    }
  } else {
    return format
  }
}

/**
 * Get citation format
 *
 * @param {*} citeproc citeproc
 * @returns string
 */
export const getCitationFormat = (citeproc) => {
  const info = citeproc.cslXml.dataObj.children[0]
  const node = info.children.find((x) => x['attrs'] && x['attrs']['citation-format'])
  // citation-format takes 5 possible values
  // https://docs.citationstyles.org/en/stable/specification.html#toc-entry-14
  /** @type {'author-date' | 'author' | 'numeric' | 'note' | 'label'} */
  const citationFormat = node['attrs']['citation-format']
  return citationFormat
}

/**
 * Get registry objects that matches a list of relevantIds
 * If sorted is false, retrieve registry item in the order of the given relevantIds
 *
 * @param {*} citeproc citeproc
 * @param {string[]} relevantIds
 * @param {boolean} sorted
 * @return {*} registry objects that matches Ids, in the correct order
 */
export const getSortedRelevantRegistryItems = (citeproc, relevantIds, sorted) => {
  const res = []
  if (sorted) {
    // If sorted follow registry order
    for (const item of citeproc.registry.reflist) {
      if (relevantIds.includes(item.id)) res.push(item)
    }
  } else {
    // Otherwise follow the relevantIds
    for (const id of relevantIds) {
      res.push(citeproc.registry.reflist.find((x) => x.id === id))
    }
  }
  return res
}

/**
 * Split a string into two parts based on a given index position
 *
 * @param {string} str
 * @param {number} index
 * @return {string[]}
 */
export const split = (str, index) => {
  return [str.slice(0, index), str.slice(index)]
}

/**
 * Check if two registry objects belong to the same author
 * Currently only checks on family name
 *
 * @param {*} item registry object
 * @param {*} item2 registry object
 * @return {boolean}
 */
export const isSameAuthor = (item, item2) => {
  const authorList = item.ref.author
  const authorList2 = item2.ref.author
  if (authorList.length !== authorList2.length) return false
  for (let i = 0; i < authorList.length; i++) {
    if (authorList[i].family !== authorList2[i].family) return false
  }
  return true
}

/**
 * @typedef {Object} FrontmatterSource
 * @property {Record<string, any>} [matter]
 * @property {Record<string, any>} [frontmatter]
 * @property {{ frontmatter?: Record<string, any> }} [astro]
 */

/**
 * @param {{ data?: FrontmatterSource }} file
 * @param {string} fieldName
 * @returns {any}
 */
export const getFrontmatterField = (file, fieldName) => {
  if (!file || !file.data) {
    return undefined
  }

  const sources = [file.data.matter, file.data.frontmatter, file.data.astro?.frontmatter]

  for (const source of sources) {
    if (source && fieldName in source) {
      return source[fieldName]
    }
  }

  return undefined
}
