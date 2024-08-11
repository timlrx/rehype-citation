export function deepCopy(value, seen = new Set()) {
  if (
    typeof value !== 'object' ||
    value === null ||
    (value.constructor !== Object && value.constructor !== Array)
  ) {
    return value
  }
  if (seen.has(value)) {
    throw new TypeError('Recursively copying circular structure')
  }
  seen.add(value)
  let copy
  if (value.constructor === Array) {
    copy = value.map((value) => deepCopy(value, seen))
  } else {
    const object = {}
    for (const key in value) {
      object[key] = deepCopy(value[key], seen)
    }
    copy = object
  }
  seen.delete(value)
  return copy
}
export default deepCopy
