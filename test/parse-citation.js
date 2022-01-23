import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { parseCitation } from '../src/parse-citation.js'

// Adapted from https://github.com/Zettlr/Citr/blob/master/test/parse-single.js
let singleCitations = [
  {
    input: '[Some prefix @identifier]',
    expected: [
      {
        prefix: 'Some prefix',
        suffix: '',
        id: 'identifier',
        locator: '',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  {
    input: '[see @doe99, pp. 33-35; also @smith04, chap. 1]',
    expected: [
      {
        prefix: 'see',
        suffix: '',
        id: 'doe99',
        locator: '33-35',
        label: 'page',
        'suppress-author': false,
      },
      {
        prefix: 'also',
        suffix: '',
        id: 'smith04',
        locator: '1',
        label: 'chapter',
        'suppress-author': false,
      },
    ],
  },
  {
    input: '[@doe99, pp. 33-35, 38-39 and *passim*]',
    expected: [
      {
        prefix: '',
        suffix: 'and *passim*',
        id: 'doe99',
        locator: '33-35, 38-39',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  {
    input: '[@smith04; @doe99]',
    expected: [
      {
        prefix: '',
        suffix: '',
        id: 'smith04',
        locator: '',
        label: 'page',
        'suppress-author': false,
      },
      {
        prefix: '',
        suffix: '',
        id: 'doe99',
        locator: '',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  {
    input: '[-@smith04]',
    expected: [
      {
        prefix: '',
        suffix: '',
        id: 'smith04',
        locator: '',
        label: 'page',
        'suppress-author': true,
      },
    ],
  },
  {
    input: '[@Clover2016, pp. 49-52, 67, 123-156, 158]',
    expected: [
      {
        prefix: '',
        suffix: '',
        id: 'Clover2016',
        locator: '49-52, 67, 123-156, 158',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  {
    input: '[@Ranciere1999, 22 and 32]',
    expected: [
      {
        prefix: '',
        suffix: 'and 32',
        id: 'Ranciere1999',
        locator: '22',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  {
    input:
      '[see for a recap of previous studies @Wilkinson2009; further -@Norris2005, 198; @Green2002, 62 ff]',
    expected: [
      {
        prefix: 'see for a recap of previous studies',
        suffix: '',
        id: 'Wilkinson2009',
        locator: '',
        label: 'page',
        'suppress-author': false,
      },
      {
        prefix: 'further',
        suffix: '',
        id: 'Norris2005',
        locator: '198',
        label: 'page',
        'suppress-author': true,
      },
      {
        prefix: '',
        suffix: 'ff',
        id: 'Green2002',
        locator: '62',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  {
    input: '[@Drury2017a, 6-7]',
    expected: [
      {
        prefix: '',
        suffix: '',
        id: 'Drury2017a',
        locator: '6-7',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  {
    input: '[see for an instructive example @Braha2012]',
    expected: [
      {
        prefix: 'see for an instructive example',
        suffix: '',
        id: 'Braha2012',
        locator: '',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  {
    input: '[@Aristotle1981, §1302a22; @Skultety2009, 352]',
    expected: [
      {
        prefix: '',
        suffix: 'a22',
        id: 'Aristotle1981',
        locator: '1302',
        label: 'section',
        'suppress-author': false,
      },
      {
        prefix: '',
        suffix: '',
        id: 'Skultety2009',
        locator: '352',
        label: 'page',
        'suppress-author': false,
      },
    ],
  },
  // expected = undefined indicates that the function should throw
  {
    input: '@work',
    expected: [
      {
        id: 'work',
      },
    ],
  },
  {
    input: '[Should not work]',
    expected: undefined,
  },
  {
    input: '[Double ID @structure2901 @second1990]',
    expected: undefined,
  },
  {
    input: '[Malformed ID inside @.this key]',
    expected: undefined,
  },
]

const parseCitationTest = suite('parse-citation')

for (let citation of singleCitations) {
  if (citation.expected === undefined) {
    // Should throw
    parseCitationTest(`should throw an error for the citation: ${citation.input}`, function () {
      assert.throws(() => {
        parseCitation(citation.input)
      })
    })
  } else {
    // Should evaluate correctly
    parseCitationTest(`should parse the citation correctly: ${citation.input}`, function () {
      let csl = parseCitation(citation.input)[1]
      assert.equal(csl, citation.expected)
    })
  }
}

parseCitationTest.run()
