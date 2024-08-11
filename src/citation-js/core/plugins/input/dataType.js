export function typeOf(thing) {
  switch (thing) {
    case undefined:
      return 'Undefined'
    case null:
      return 'Null'
    default:
      return thing.constructor.name
  }
}
export function dataTypeOf(thing) {
  switch (typeof thing) {
    case 'string':
      return 'String'
    case 'object':
      if (Array.isArray(thing)) {
        return 'Array'
      } else if (typeOf(thing) === 'Object') {
        return 'SimpleObject'
      } else if (typeOf(thing) !== 'Null') {
        return 'ComplexObject'
      }
    default:
      return 'Primitive'
  }
}
