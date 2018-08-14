const { disallow, iff, isProvider } = require('feathers-hooks-common')
const { authenticate } = require('feathers-authentication').hooks
const findAllUserQuestionnaires = require('./hooks/hook.find-all-user-questionnaires')

module.exports = function (app) {
  return {
    before: {
      all: [],
      find: [
        iff(
          isProvider('external'),
          // If the user is logged in, only show the questionnaires they have not completed
          iff(
            context => context.params.accessToken || (context.params.headers && context.params.headers.authorization),
            authenticate('jwt'),
            findAllUserQuestionnaires()
        ))],
      get: [],
      create: [disallow('external')],
      update: [disallow('external')],
      patch: [disallow('external')],
      remove: [disallow('external')]
    },

    after: {
      all: [],
      find: [context => {
        return Promise.all(context.result.data.map(questionnaire =>
          app.service('questions').find({query: {questionnaireId: questionnaire._id.toString(), $sort: { sortIndex: 1 }}})
        ))
        .then(result => {
          context.result.data = context.result.data.map((questionnaire, i) => {
            questionnaire.questions = result[i].data
            return questionnaire
          })
          return Promise.resolve(context)
        })
      }],
      get: [context => {
        return app.service('questions').find({query: {questionnaireId: context.id.toString(), $sort: { sortIndex: 1 }}})
          .then(result => {
            context.result.questions = result.data
            return Promise.resolve(context)
          })
      }],
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
