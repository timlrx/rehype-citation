class Register {
  constructor(data = {}) {
    this.data = data
  }
  set(key, value) {
    this.data[key] = value
    return this
  }
  add(...args) {
    return this.set(...args)
  }
  delete(key) {
    delete this.data[key]
    return this
  }
  remove(...args) {
    return this.delete(...args)
  }
  get(key) {
    return this.data[key]
  }
  has(key) {
    return Object.prototype.hasOwnProperty.call(this.data, key)
  }
  list() {
    return Object.keys(this.data)
  }
}
export default Register
