// Initializes the `subscribe` service on path `/subscribe`
const createService = require('./subscribe.class.js')
const hooks = require('./subscribe.hooks')
const filters = require('./subscribe.filters')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'subscribe',
    paginate,
    app
  }

  // Initialize our service with any options it requires
  app.use('/subscribe', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('subscribe')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
