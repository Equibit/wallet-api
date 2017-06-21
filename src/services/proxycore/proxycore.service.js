// Initializes the `proxycore` service on path `/proxycore`
const createService = require('./proxycore.class.js')
const hooks = require('./proxycore.hooks')
const filters = require('./proxycore.filters')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'proxycore',
    paginate,
    app
  }

  // Initialize our service with any options it requires
  app.use('/proxycore', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('proxycore')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
