const { authenticate } = require('feathers-authentication').hooks
const { iff, isProvider } = require('feathers-hooks-common')

// decorate params with portfolios the user owns in 'userPortfolios' property for validations
const addUserPortfoliosToParams = require('../../hooks/hook.add-user-portfolios-to-params')

module.exports = function (app) {
  return {
    before: {
      all: [ authenticate('jwt') ],
      find: [],
      get: [],
      create: [
        iff(
          isProvider('external'),
          addUserPortfoliosToParams(app)
        )
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
