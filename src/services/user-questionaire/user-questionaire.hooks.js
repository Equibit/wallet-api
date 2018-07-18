
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
        // Check if questionaire exists
        context => {
          return app.service('questionaires').get(context.data.questionaireId)
          .then(questionare => Promise.resolve(context))
          .catch(err => Promise.reject(new errors.BadRequest(err.message)))
        }
      ],
      update: [mapUpdateToPatch()],
      patch: [
        preventChanges(true, 'questionaireId', 'rewarded'),
        context => {
          return app.service('user-questionaire').get(context.id)
          .then(questionare => {
            if (questionare.completed && !context.data.completed) {
              return Promise.reject(new errors.BadRequest("Can't change the completed status of a questionaire that is already completed!"))
            }
            return Promise.resolve(context)
          })
        },
        context => {
          if (context.data.completed) {
            // Make sure started field is false when completed
            context.data.started = false
            // Validate that you completed all the questions
            return app.service('user-answers').find({query: { userQuestionaireId: context.id }})
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
