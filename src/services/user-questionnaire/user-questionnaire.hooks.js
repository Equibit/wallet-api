
const errors = require('feathers-errors')
const { preventChanges, iff } = require('feathers-hooks-common')
const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser, restrictToOwner } = require('feathers-authentication-hooks')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const completeValidation = require('./hooks/hooks.complete-validate')
const validateAnswers = require('./hooks/hooks.validate-answers')
const initialAnswers = require('./hooks/hooks.initial-answers')

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
        // Check if questionnaire exists
        context => {
          return app.service('questionnaires').get(context.data.questionnaireId)
          .then(() => context)
          .catch(err => Promise.reject(new errors.BadRequest(err.message)))
        },
        context => {
          context.data.status = 'STARTED'
          return context
        },
        initialAnswers(app),
        associateCurrentUser({ idField: '_id', as: 'userId' })
      ],
      update: [mapUpdateToPatch()],
      patch: [
        preventChanges(true, 'questionnaireId', 'rewarded'),
        iff(
          context => context.data.answers,
          validateAnswers(app)
        ),
        context => {
          return context.service.get(context.id)
          .then(questionnaire => {
            if (questionnaire.status === 'COMPLETED' && context.data.status !== 'COMPLETED') {
              return Promise.reject(new errors.BadRequest("Can't change the completed status of a questionnaire that is already completed!"))
            }
            return Promise.resolve(context)
          })
        },
        iff(
          context => context.data.status === 'COMPLETED',
          completeValidation(app)
        )
      ],
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
