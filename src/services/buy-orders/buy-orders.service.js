// Initializes the `buy-orders` service on path `/buy-orders`
const createService = require('feathers-mongoose')
const createModel = require('../../models/buy-orders.model')
const hooks = require('./buy-orders.hooks')
const filters = require('./buy-orders.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'buy-orders',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/buy-orders', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('buy-orders')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
