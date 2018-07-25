const { disallow } = require('feathers-hooks-common')

module.exports = function (app) {
  return {
    before: {
      all: [],
      find: [],
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
