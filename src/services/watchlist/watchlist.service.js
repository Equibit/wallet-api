// Initializes the `watch` service on path `/watch`
const createService = require('feathers-mongoose')
const createModel = require('./watchlist.model')
const hooks = require('./watchlist.hooks')
const filters = require('./watchlist.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'watchlist',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/watchlist', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('watchlist')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
