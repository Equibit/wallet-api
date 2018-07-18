const validateAnswers = require('./hooks/hooks.validate-answers')
const questionaireExists = require('./hooks/hooks.questionaire-exists')
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
        questionaireExists(app),
        validateAnswers(app)
      ],
      update: [mapUpdateToPatch()],
      patch: [
        preventChanges(true, 'userQuestionaireId'),
        validateAnswers(app)
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
