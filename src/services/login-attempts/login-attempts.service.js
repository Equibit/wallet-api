// Initializes the `login-attempts` service on path `/login-attempts`
const createService = require('feathers-mongoose')
const createModel = require('./login-attempts.model')
const hooks = require('./login-attempts.hooks')
const filters = require('./login-attempts.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'login-attempts',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/login-attempts', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('login-attempts')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
