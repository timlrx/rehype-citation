/**
 * Captures normal citation in square bracket and in-text citation
 * Citation key start should start with a letter, digit, or _,
 * and contains only alphanumerics and single internal punctuation characters (:.#$%&-+?<>~/),
 *
 * e.g. [-@wadler1990], [@hughes1989, sec 3.4], [see @wadler1990; and @hughes1989, pp. 4]
 * and @wadler1990
 *
 * Group #1 - citation term without [] bracket e.g. -@wadler1990
 * Group #2 - in-text citation term e.g. @wadler1990
 *
 * \[([^[\]]*@[^[\]]+)\] for group #1
 * (?!\b)@([a-zA-Z0-9_][a-zA-Z0-9_:.#$%&\-+?<>~]*) for group #2
 * Use (?!\b) to avoid email like address e.g. xyx@google.com
 * */
export const citeExtractorRe =
  /\[([^[\]]*@[^[\]]+)\]|(?!\b)(@[a-zA-Z0-9_][a-zA-Z0-9_:.#$%&\-+?<>~]*)/
export const citeKeyRe = /@([a-zA-Z0-9_][a-zA-Z0-9_:.#$%&\-+?<>~]*)/g
export const citeBracketRe = /\[.*\]/
