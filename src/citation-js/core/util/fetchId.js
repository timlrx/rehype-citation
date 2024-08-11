function fetchId(list, prefix) {
  let id
  while (id === undefined || list.includes(id)) {
    id = `${prefix}${Math.random().toString().slice(2)}`
  }
  return id
}
export default fetchId
