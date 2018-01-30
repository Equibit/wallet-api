// Initializes the `importmulti` service on path `/importmulti`
const createService = require('./importmulti.class.js')
const hooks = require('./importmulti.hooks')
const filters = require('./importmulti.filters')

module.exports = function () {
  const app = this

  const options = {
    name: 'importmulti',
    app
  }

  // Initialize our service with any options it requires
  app.use('/importmulti', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('importmulti')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
