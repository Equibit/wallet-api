// Initializes the `user-questionaire` service on path `/user-questionaire`
const createService = require('feathers-mongoose')
const createModel = require('./user-questionaire.model')
const hooks = require('./user-questionaire.hooks')
const filters = require('./user-questionaire.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'user-questionaire',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/user-questionaire', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('user-questionaire')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
