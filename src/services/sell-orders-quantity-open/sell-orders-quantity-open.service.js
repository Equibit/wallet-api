// Initializes the `sell-orders-quantity-open` service on path `/sell-orders-quantity-open`
const createService = require('./sell-orders-quantity-open.class.js')
const hooks = require('./sell-orders-quantity-open.hooks')
const filters = require('./sell-orders-quantity-open.filters')

module.exports = function () {
  const app = this

  const options = {
    name: 'sell-orders-quantity-open',
    app
  }

  // Initialize our service with any options it requires
  app.use('/sell-orders-quantity-open', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('sell-orders-quantity-open')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
