// Initializes the `user-questionnaire` service on path `/user-questionnaire`
const createService = require('feathers-mongoose')
const createModel = require('./user-questionnaire.model')
const hooks = require('./user-questionnaire.hooks')
const filters = require('./user-questionnaire.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'user-questionnaire',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/user-questionnaire', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('user-questionnaire')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
