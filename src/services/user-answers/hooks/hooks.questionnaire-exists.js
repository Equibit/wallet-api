const errors = require('feathers-errors')

module.exports = function (app) {
  return function (context) {
    return app.service('user-questionnaire').get(context.data.userQuestionnaireId)
    .then(() => Promise.resolve(context))
    .catch(err => Promise.reject(new errors.BadRequest(err.message)))
  }
}
