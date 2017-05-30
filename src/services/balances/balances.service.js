// Initializes the `balances` service on path `/balances`
const createService = require('./balances.class.js')
const hooks = require('./balances.hooks')
const filters = require('./balances.filters')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'balances',
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/balances', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('balances')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
