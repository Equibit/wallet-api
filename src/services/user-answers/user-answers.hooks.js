const { disallow } = require('feathers-hooks-common')
const validateAnswers = require('./hooks/hook.validate-answers')

module.exports = function (app) {
  return {
    before: {
      all: [disallow('external')],
      find: [],
      get: [],
      create: [
        validateAnswers(app)
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
}
