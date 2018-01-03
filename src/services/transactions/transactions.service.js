// Initializes the `transactions` service on path `/transactions`
const createService = require('feathers-mongoose')
const createModel = require('./transactions.model')
const hooks = require('./transactions.hooks')
const filters = require('./transactions.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'transactions',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/transactions', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('transactions')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
