// Initializes the `portfolio-addresses` service on path `/portfolio-addresses`
const createService = require('feathers-mongoose')
const createModel = require('./portfolio-addresses.model')
const hooks = require('./portfolio-addresses.hooks')
const filters = require('./portfolio-addresses.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'portfolio-addresses',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/portfolio-addresses', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('portfolio-addresses')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
