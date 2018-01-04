// Initializes the `bitcoin-average` service on path `/bitcoin-average`
const createService = require('./bitcoin-average.class.js')
const hooks = require('./bitcoin-average.hooks')
const filters = require('./bitcoin-average.filters')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'bitcoin-average',
    paginate,
    app
  }

  // Initialize our service with any options it requires
  app.use('/bitcoin-average', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('bitcoin-average')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
