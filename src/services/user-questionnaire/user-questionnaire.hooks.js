
const errors = require('feathers-errors')
const { preventChanges } = require('feathers-hooks-common')
const { authenticate } = require('feathers-authentication').hooks
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')

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
          return app.service('user-questionnaire').get(context.id)
          .then(questionare => {
            if (questionare.status === 'COMPLETED' && context.data.status !== 'COMPLETED') {
              return Promise.reject(new errors.BadRequest("Can't change the completed status of a questionnaire that is already completed!"))
            }
            return Promise.resolve(context)
          })
        },
        context => {
          if (context.data.status === 'COMPLETED') {
            // Validate that you completed all the questions
            return app.service('user-answers').find({query: { userQuestionnaireId: context.id }})
              .then(result => {
                const answers = result.data[0].answers
                if (answers.some(ans => ans === null)) {
                  return Promise.reject(new errors.BadRequest('Not all questions are answered!'))
                }
                return Promise.resolve(context)
              })
          }
          return Promise.resolve(context)
        }
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
