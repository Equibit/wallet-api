// Initializes the `payment-logging` service on path `/payment-logging`
const createService = require('feathers-mongoose')
const createModel = require('./payment-logging.model')
const hooks = require('./payment-logging.hooks')
const filters = require('./payment-logging.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'payment-logging',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/payment-logging', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('payment-logging')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
