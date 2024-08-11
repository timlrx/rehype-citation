function currentVersion() {
  return this.log.length
}
function retrieveVersion(versnum = 1) {
  if (versnum <= 0 || versnum > this.currentVersion()) {
    return null
  } else {
    const [data, options] = this.log[versnum - 1]
    const image = new this.constructor(JSON.parse(data), JSON.parse(options))
    image.log = this.log.slice(0, versnum)
    return image
  }
}
function undo(number = 1) {
  return this.retrieveVersion(this.currentVersion() - number)
}
function retrieveLastVersion() {
  return this.retrieveVersion(this.currentVersion())
}
function save() {
  this.log.push([JSON.stringify(this.data), JSON.stringify(this._options)])
  return this
}
export { currentVersion, retrieveVersion, retrieveLastVersion, undo, save }
