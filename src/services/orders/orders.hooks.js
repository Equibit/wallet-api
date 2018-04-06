const { authenticate } = require('feathers-authentication').hooks
const { discard, iff, isProvider, stashBefore } = require('feathers-hooks-common')
const idRequired = require('../../hooks/hook.id-required')
const allowCancel = require('./hooks/hook.allow-cancel')

// todo: discard userId if its different from current user

module.exports = function (app) {
  return {
    before: {
      all: [
        authenticate('jwt')
      ],
      find: [],
      get: [],
      create: [],
      update: [
        iff(
          isProvider('external'),
          idRequired(),
          stashBefore(),
          allowCancel(app)
        )
      ],
      patch: [
        iff(
          isProvider('external'),
          idRequired(),
          stashBefore(),
          allowCancel(app)
        )
      ],
      remove: [
        iff(
          isProvider('external'),
          idRequired()
        )
      ]
    },

    after: {
      all: [
        discard('__v')
      ],
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
