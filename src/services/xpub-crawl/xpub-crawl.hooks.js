const { authenticate } = require('feathers-authentication').hooks
const { iff, isProvider } = require('feathers-hooks-common')

// decorate params with portfolios the user owns in 'userPortfolios' property for validations
const addUserPortfoliosToParams = require('../../hooks/hook.add-user-portfolios-to-params')

// restrict query to portfolioIds owned by params.user
const restrictQueryToUserPortfolio = require('../../hooks/hook.restrict-query-to-user-portfolio')

module.exports = function (app) {
  return {
    before: {
      all: [ authenticate('jwt') ],
      find: [
        iff(
          isProvider('external'),
          addUserPortfoliosToParams(app),
          restrictQueryToUserPortfolio()
        )
      ],
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
