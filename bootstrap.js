/**
 *
 * A handy script to inline the relevant @citation-js files
 * Extracts mjs-lib files from core, plugin-bibjson, plugin-bibtex, plugin-csl
 * and resolves @citation-js/core path locally
 *
 * This create a much smaller ESM bundle of @citation-js with no side-effects
 *
 * After running bootstrap.js, some additional work needs to be done e.g. modifying pkg references
 */

import fs from 'fs'
import path from 'path'
import glob from 'glob'

const copyDir = (source, destination) => {
  fs.mkdirSync(destination, { recursive: true })

  fs.readdirSync(source, { withFileTypes: true }).forEach((entry) => {
    let sourcePath = path.join(source, entry.name)
    let destinationPath = path.join(destination, entry.name)

    entry.isDirectory()
      ? copyDir(sourcePath, destinationPath)
      : fs.copyFileSync(sourcePath, destinationPath)
  })
}

const modFile = (file) => {
  const data = fs.readFileSync(file, { encoding: 'utf8' })
  if (data.includes('@citation-js/core')) {
    const relativePath = path.relative(path.dirname(file), 'src/citation-js/core/index.js')
    const result = data.replace('@citation-js/core', relativePath)
    fs.writeFileSync(file, result)
  }
}

const main = () => {
  copyDir('./node_modules/@citation-js/core/lib-mjs', 'src/citation-js/core')
  copyDir('./node_modules/@citation-js/plugin-bibjson/lib-mjs', 'src/citation-js/plugin-bibjson')
  copyDir('./node_modules/@citation-js/plugin-bibtex/lib-mjs', 'src/citation-js/plugin-bibtex')
  copyDir('./node_modules/@citation-js/plugin-csl/lib-mjs', 'src/citation-js/plugin-csl')
  glob.sync('src/citation-js/**/*.js').forEach((file) => modFile(file))
}

main()
