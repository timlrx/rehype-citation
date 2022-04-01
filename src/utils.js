import fetch from 'cross-fetch'

export const isNode = typeof window === 'undefined'

export const readFile = async (path) => {
  if (isValidHttpUrl(path)) {
    return fetch(path)
      .then((response) => response.text())
      .then((data) => data)
  } else {
    if (isNode) {
      return import('fs').then((fs) => fs.readFileSync(path, 'utf8'))
    } else {
      throw new Error(`Cannot read non valid URL in node env.`)
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
export const isValidHttpUrl = (str) => {
  let url

  try {
    url = new URL(str)
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
  let bibliography = ''
  if (options.bibliography) {
    bibliography = options.bibliography
    // @ts-ignore
  } else if (file?.data?.frontmatter?.bibliography) {
    // @ts-ignore
    bibliography = file.data.frontmatter.bibliography
    // If local path, get absolute path
    if (!isValidHttpUrl(bibliography)) {
      if (isNode) {
        bibliography = await import('path').then((path) =>
          path.join(options.path || file.cwd, bibliography)
        )
      } else {
        throw new Error(`Cannot read non valid bibliography URL in node env.`)
      }
    }
  }

  return bibliography
}

/**
 * Load CSL if it is a file path
 *
 * @param {*} Cite cite object from citation-js configured with the required CSLs
 * @param {string} format CSL name e.g. apa or file path to CSL file
 * @param {string} root optional root path
 */
export const loadCSL = async (Cite, format, root = '') => {
  const config = Cite.plugins.config.get('@csl')
  if (!Object.keys(config.templates.data).includes(format)) {
    let cslPath = ''
    if (isValidHttpUrl(format)) cslPath = format
    else {
      if (isNode) {
        cslPath = await import('path').then((path) => path.join(root, format))
      }
    }
    try {
      config.templates.add('customCSL', await readFile(cslPath))
    } catch (err) {
      throw new Error(`Input CSL option, ${format}, is invalid or is an unknown file.`)
    }
    return 'customCSL'
  } else {
    return format
  }
}
