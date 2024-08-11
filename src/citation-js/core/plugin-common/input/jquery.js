export function parse(input) {
  return input.val() || input.text() || input.html()
}
