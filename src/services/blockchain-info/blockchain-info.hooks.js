const { iff, isProvider, stashBefore } = require('feathers-hooks-common')
const errors = require('feathers-errors')
const confirmedTransactionHooks = require('./hooks/hook.confirmed-transactions')

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
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [
        confirmedTransactionHooks()
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
