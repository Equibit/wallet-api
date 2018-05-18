// Initializes the `health-check` service on path `/health-check`
const createService = require('./health-check.class.js')
const hooks = require('./health-check.hooks')
const filters = require('./health-check.filters')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'health-check',
    app,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/health-check', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('health-check')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
