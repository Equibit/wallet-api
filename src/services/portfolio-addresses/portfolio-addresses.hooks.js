const { authenticate } = require('feathers-authentication').hooks
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const { discard, iff, isProvider, preventChanges, disallow } = require('feathers-hooks-common')

// decorate params with portfolios the user owns in 'userPortfolios' property for validations
const addUserPortfoliosToParams = require('../../hooks/hook.add-user-portfolios-to-params')

// restrict query to portfolioIds owned by params.user
const restrictQueryToUserPortfolio = require('../../hooks/hook.restrict-query-to-user-portfolio')

// helps avoid accidnetal data wipes: if id is not present on hook context and _id is not in params query, request fails
const idRequired = require('../../hooks/hook.id-required')

// make sure create data has portfolioId specified that belongs to current user
const verifyPortfolioIdOnData = require('./hooks/hook.verify-portfolio-id-on-data')

// only execute on external calls, verifies specified id belongs to the logged in user
const verifyIdBelongsToUser = require('./hooks/hook.verify-id-belongs-to-user')

// return existing record if create data is a duplicate
const returnIfExistsAlready = require('./hooks/hook.return-if-exists-already')

// import if create data is a new addresses and 'importAddress' was provided
const importIfNew = require('./hooks/hook.import-if-new')

// pay ico investors
const sendIcoPayment = require('./hooks/hook.send-ico-payment')

module.exports = function (app) {
  return {
    before: {
      all: [
        iff(
          isProvider('external'),
          authenticate('jwt'),
          addUserPortfoliosToParams(app)
        )
      ],
      find: [
        iff(
          isProvider('external'),
          restrictQueryToUserPortfolio()
          // ,
          // context => {
          //   const { params } = context
          //   const { user, userPortfolios, query } = params
          //   const portfoliosService = app.service('portfolio-addresses')
          //   return portfoliosService.create({
          //     portfolioId: query.portfolioId,
          //     index: ~~(Math.random() * 1000),
          //     type: 'EQB', // EQB or BTC
          //     isChange: false,
          //     isUsed: false
          //   }).then(() => {
          //     return Promise.resolve(context)
          //   })
          // }
        )
      ],
      get: [
        iff(
          isProvider('external'),
          verifyIdBelongsToUser(app)
        )
      ],
      create: [
        iff(
          isProvider('external'),
          verifyPortfolioIdOnData()
        ),
        returnIfExistsAlready(app),
        importIfNew(app),
        iff(
          hook => hook.data.type === 'EQB',
          sendIcoPayment()
        )
      ],
      update: [
        mapUpdateToPatch()
      ],
      patch: [
        iff(
          isProvider('external'),
          idRequired(),
          verifyIdBelongsToUser(app),
          preventChanges(
            true,
            'portfolioId',
            'index',
            'type',
            'isChange',
            // 'isUsed', // only field that can be patched
            'createdAt',
            'updatedAt'
          )
        )
      ],
      remove: [
        disallow('external')
      ]
    },

    after: {
      all: [
        discard('__v')
      ],
      find: [
        context => {
          if (Array.isArray(context.result)) {
            context.result = { data: context.result }
          }
          return Promise.resolve(context)
        }
      ],
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
      create: [
        // If multiple of same NEW data are created at once (see tests), the async hooks on event loop each say that it doesn't exist yet
        // then, async, each is created one after the other anyway
        // (but 2nd one (and 3rd etc) throws because of the compound index restriction on the Schema)
        // This un-throws the duplication of compound index on creation and returns the first one created with the compound key.
        context => {
          const { error } = context

          if (error && error.name === 'Conflict' && /index.*already exists/i.test(error.message)) {
            context.error = null
            return returnIfExistsAlready(app)(context)
          }

          return Promise.resolve(context)
        }
      ],
      update: [],
      patch: [],
      remove: []
    }
  }
}
