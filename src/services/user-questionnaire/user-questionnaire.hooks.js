const errors = require('feathers-errors')
const { preventChanges, iff, isProvider, discard } = require('feathers-hooks-common')
const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser, restrictToOwner } = require('feathers-authentication-hooks')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const completeValidation = require('./hooks/hook.complete-validate')
const validateAnswers = require('./hooks/hook.validate-answers')
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
        associateCurrentUser({ idField: '_id', as: 'userId' })
      ],
      update: [mapUpdateToPatch()],
      patch: [
        iff(
          isProvider('external'),
          preventChanges(true, 'questionnaireId', 'lock', 'rewarded', 'manualPaymentRequired')
        ),
        validateAnswers(app),
<<<<<<< HEAD
<<<<<<< HEAD
        completeValidation(app)        
=======
        completeValidation(app)
>>>>>>> 795b3ca9c73e4a7a0154b271f825dc354e370c7e
=======
        completeValidation(app)
>>>>>>> parent of 138045b... fix conflicts
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
