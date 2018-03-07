// Initializes the `import-address` service on path `/import-address`
const createService = require('./import-address.class.js')
const hooks = require('./import-address.hooks')
const filters = require('./import-address.filters')

module.exports = function () {
  const app = this

  const options = {
    name: 'import-address',
    app
  }

  // Initialize our service with any options it requires
  app.use('/import-address', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('import-address')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
