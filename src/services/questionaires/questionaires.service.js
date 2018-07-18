// Initializes the `questionaires` service on path `/questionaires`
const createService = require('feathers-mongoose')
const createModel = require('./questionaires.model')
const hooks = require('./questionaires.hooks')
const filters = require('./questionaires.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'questionaires',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/questionaires', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('questionaires')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
