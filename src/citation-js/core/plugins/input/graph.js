export function applyGraph(entry, graph) {
  if (entry._graph) {
    const index = graph.findIndex(({ type }) => type === '@else/list+object')
    if (index !== -1) {
      graph.splice(index + 1, 0, ...entry._graph.slice(0, -1))
    }
  }
  entry._graph = graph
  return entry
}
export function removeGraph(entry) {
  delete entry._graph
  return entry
}
