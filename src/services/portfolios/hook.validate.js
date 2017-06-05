const Ajv = require('ajv')
const { validateSchema } = require('feathers-hooks-common')
const schema = {
  title: 'Portfolio',
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    address: {
      type: 'string'
    }
  },
  required: ['name', 'address'],
  not: {
    required: [ 'balance' ]
  }
}

module.exports = function () {
  return validateSchema(schema, Ajv)
}
