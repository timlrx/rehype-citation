import fetch from 'node-fetch'

export const isNode = typeof window === 'undefined'

export const existsFile = async (path) => {
  if (isValidHttpUrl(path)) {
    return fetch(path, { method: 'HEAD' }).then((res) => res.ok)
  } else {
    if (isNode) {
      return import('fs').then((fs) => fs.existsSync(path))
    } else {
      throw new Error(`Cannot read non valid URL in node env.`)
    }
  }
}

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
