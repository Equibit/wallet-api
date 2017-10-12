// Initializes the `offers` service on path `/offers`
const createService = require('feathers-mongoose')
const createModel = require('../../models/offers.model')
const hooks = require('./offers.hooks')
const filters = require('./offers.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'offers',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/offers', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('offers')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
