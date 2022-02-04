import Cite from './index.js'

const currentVersion = function () {
  return this.log.length
}

const retrieveVersion = function (versnum = 1) {
  if (versnum <= 0 || versnum > this.currentVersion()) {
    return null
  } else {
    const [data, options] = this.log[versnum - 1]
    const image = new Cite(JSON.parse(data), JSON.parse(options))
    image.log = this.log.slice(0, versnum)
    return image
  }
}

const undo = function (number = 1) {
  return this.retrieveVersion(this.currentVersion() - number)
}

const retrieveLastVersion = function () {
  return this.retrieveVersion(this.currentVersion())
}

const save = function () {
  this.log.push([JSON.stringify(this.data), JSON.stringify(this._options)])
  return this
}

export { currentVersion, retrieveVersion, retrieveLastVersion, undo, save }
