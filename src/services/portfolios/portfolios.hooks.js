const { authenticate } = require('feathers-authentication').hooks
const validate = require('./hook.validate')
const getNextIndex = require('./hook.get-next-index')
const addBalance = require('./hook.add-balance')

module.exports = {
  before: {
    all: [
      authenticate('jwt')
    ],
    find: [],
    get: [],
    create: [
      validate(),
      getNextIndex(),
      addBalance()
    ],
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
