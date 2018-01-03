const Ajv = require('ajv')
const { validateSchema } = require('feathers-hooks-common')
const schema = {
  title: 'Portfolio',
  type: 'object',
  properties: {
    name: {
      type: 'string'
    }
  },
  required: ['name'],
  not: {
    required: [ 'balance' ]
  }
}

module.exports = function () {
  return validateSchema(schema, Ajv)
}
