const errors = require('feathers-errors')
const { unless } = require('feathers-hooks-common')

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [unless(
      context => context.data.node && context.data.message,
      context => Promise.reject(new errors.BadRequest('Requires node and message'))
    )],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}
