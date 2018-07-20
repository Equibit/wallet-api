// Initializes the `questionnaires` service on path `/questionnaires`
const createService = require('feathers-mongoose')
const createModel = require('./questionnaires.model')
const hooks = require('./questionnaires.hooks')
const filters = require('./questionnaires.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'questionnaires',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/questionnaires', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('questionnaires')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
