const { authenticate } = require('feathers-authentication').hooks
const { disallow } = require('feathers-hooks-common')

module.exports = function (app) {
  return {
    before: {
      all: [
        disallow('rest'),
        authenticate('jwt')
      ],
      find: [],
      get: [],
      create: [],
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
}
