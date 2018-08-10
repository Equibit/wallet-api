const errors = require('feathers-errors')
const { iff, isProvider, discard, required, disallow } = require('feathers-hooks-common')
const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser, restrictToOwner } = require('feathers-authentication-hooks')
const sendReward = require('./hooks/hook.send-reward')

module.exports = function (app) {
  return {
    before: {
      all: [authenticate('jwt')],
      find: [
        restrictToOwner({ idField: '_id', ownerField: 'userId' })
      ],
      get: [
        restrictToOwner({ idField: '_id', ownerField: 'userId' })
      ],
      create: [
        iff(
          isProvider('external'),
          discard('status', 'manualPaymentRequired'),
          required('answers')
        ),
        // Check if questionnaire exists
        context => {
          return app.service('questionnaires').get(context.data.questionnaireId)
          .then(() => context)
          .catch(err => Promise.reject(new errors.BadRequest(err.message)))
        },
        associateCurrentUser({ idField: '_id', as: 'userId' }),
        // Send answers to service
        context => {
          const { questionnaireId, answers } = context.data
          return app.service('user-answers').create({ questionnaireId, answers })
            .then(() => context)
        },
        // Make sure to unset address before doing rewards
        context => {
          context.params.address = context.data.address
          context.data.address = null
          return context
        }
      ],
      update: [disallow('external')],
      patch: [disallow('external')],
      remove: [disallow('external')]
    },

    after: {
      all: [],
      find: [],
      get: [],
      create: [sendReward()],
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
