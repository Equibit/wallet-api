const errors = require('feathers-errors')
<<<<<<< HEAD
const { preventChanges, iff, isProvider, discard } = require('feathers-hooks-common')
=======
const { preventChanges, iff, isProvider } = require('feathers-hooks-common')
>>>>>>> Added rewards hook.
const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser, restrictToOwner } = require('feathers-authentication-hooks')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const completeValidation = require('./hooks/hook.complete-validate')
const validateAnswers = require('./hooks/hook.validate-answers')
<<<<<<< HEAD
=======
const initialAnswers = require('./hooks/hook.initial-answers')
>>>>>>> Added rewards hook.
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
          discard('lock', 'rewarded', 'manualPaymentRequired')
        ),
        // Check if questionnaire exists
        context => {
          return app.service('questionnaires').get(context.data.questionnaireId)
          .then(() => context)
          .catch(err => Promise.reject(new errors.BadRequest(err.message)))
        },
<<<<<<< HEAD
=======
        initialAnswers(app),
>>>>>>> Added rewards hook.
        associateCurrentUser({ idField: '_id', as: 'userId' })
      ],
      update: [mapUpdateToPatch()],
      patch: [
        iff(
          isProvider('external'),
          preventChanges(true, 'questionnaireId', 'lock', 'rewarded', 'manualPaymentRequired')
        ),
        validateAnswers(app),
        completeValidation(app)
      ],
      remove: []
    },

    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [
        sendReward()
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
