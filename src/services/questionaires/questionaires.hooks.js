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
        return Promise.all(context.result.data.map(questionaire =>
          app.service('questions').find({query: {questionaireId: questionaire._id.toString()}})
        ))
          .then(result => {
            context.result.data = context.result.data.map((questionaire, i) => {
              questionaire.questions = result[i].data
              return questionaire
            })
            return Promise.resolve(context)
          })
      }],
      get: [context => {
        return app.service('questions').find({query: {questionaireId: context.id.toString()}})
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
