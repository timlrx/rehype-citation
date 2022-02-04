//@ts-nocheck
import Cite from './index.js'

const async = function (data, options, callback) {
  if (typeof options === 'function' && !callback) {
    callback = options
    options = undefined
  }

  const promise = Cite().setAsync(data, options)

  if (typeof callback === 'function') {
    promise.then(callback)
    return undefined
  } else {
    return promise
  }
}

export default async
