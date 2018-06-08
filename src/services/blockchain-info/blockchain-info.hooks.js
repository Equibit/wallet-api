const { iff, isProvider, stashBefore } = require('feathers-hooks-common')
const errors = require('feathers-errors')
const confirmedTransactionHooks = require('./hooks/hook.confirmed-transactions')
const expireOffers = require('./hooks/hook.expire-offers')
const addEnvSettings = require('./hooks/hook.add-env-settings')

module.exports = function (app) {
  return {
    before: {
      all: [],
      find: [],
      get: [],
      create: [
        iff(
          isProvider('external'),
          hook => { throw new errors.Forbidden() }
        )
      ],
      update: [
        iff(
          isProvider('external'),
          hook => { throw new errors.Forbidden() }
        )
      ],
      patch: [
        iff(
          isProvider('external'),
          hook => { throw new errors.Forbidden() }
        ),
        stashBefore()
      ],
      remove: [
        iff(
          isProvider('external'),
          hook => { throw new errors.Forbidden() }
        )
      ]
    },

    after: {
      all: [
        addEnvSettings()
      ],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [
        iff(
          // there is no params.before if there was an error recorded (patch uses a query instead of an ID)
          hook => hook.params.before,
          confirmedTransactionHooks(),
          expireOffers()
        )
      ],
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
