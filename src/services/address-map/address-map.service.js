// Initializes the `address-map` service on path `/address-map`
const createService = require('feathers-mongoose')
const createModel = require('../../models/address-map.model')
const hooks = require('./address-map.hooks')
const filters = require('./address-map.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'address-map',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/address-map', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('address-map')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
