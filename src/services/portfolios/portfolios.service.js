// Initializes the `portfolios` service on path `/portfolios`
const createService = require('feathers-mongoose')
const createModel = require('./portfolios.model')
const hooks = require('./portfolios.hooks')
const filters = require('./portfolios.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'portfolios',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/portfolios', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('portfolios')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
