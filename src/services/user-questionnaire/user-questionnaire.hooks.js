
const errors = require('feathers-errors')
const { preventChanges, iff } = require('feathers-hooks-common')
const { authenticate } = require('feathers-authentication').hooks
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const completeValidation = require('./hooks/hooks.complete-validate')

module.exports = function (app) {
  return {
    before: {
      all: [authenticate('jwt')],
      find: [],
      get: [],
      create: [
        // Check if questionnaire exists
        context => {
          return app.service('questionnaires').get(context.data.questionnaireId)
          .then(questionnaire => Promise.resolve(context))
          .catch(err => Promise.reject(new errors.BadRequest(err.message)))
        },
        context => {
          context.data.status = 'STARTED'
          return context
        }
      ],
      update: [mapUpdateToPatch()],
      patch: [
        preventChanges(true, 'questionnaireId', 'rewarded'),
        context => {
          return context.service.get(context.id)
          .then(questionare => {
            if (questionare.status === 'COMPLETED' && context.data.status !== 'COMPLETED') {
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
