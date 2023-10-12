import yaml from 'js-yaml'
import { plugins } from '../core/index.js'

// See https://github.com/nodeca/js-yaml/issues/569
const timestampTag = 'tag:yaml.org,2002:timestamp'
const timestamp = yaml.DEFAULT_SCHEMA.compiledTypeMap.scalar[timestampTag]

const date = new yaml.Type(timestampTag, {
  kind: 'scalar',
  resolve: timestamp.resolve,
  construct: timestamp.construct,
  instanceOf: Date,
  represent(object) {
    return object.toISOString().split('T')[0]
  },
})

const CFF_SCHEMA = yaml.DEFAULT_SCHEMA.extend({
  implicit: [date],
  explicit: [],
})

plugins.add('@else', {
  input: {
    '@else/yaml': {
      parseType: {
        dataType: 'String',
        tokenList: {
          split: /\n(\s{2})*(-\s)?/,
          token: /^[\w-]*: /,
          every: false,
        },
      },
      parse(file) {
        return yaml.load(file, { json: true })
      },
    },
  },
  output: {
    yaml(data) {
      return yaml.dump(data, { schema: CFF_SCHEMA })
    },
  },
})
