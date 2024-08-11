function async(data, options, callback) {
  if (typeof options === 'function' && !callback) {
    callback = options
    options = undefined
  }
  const promise = new this().setAsync(data, options)
  if (typeof callback === 'function') {
    promise.then(callback)
    return undefined
  } else {
    return promise
  }
}
export default async
