// Initializes the `transaction-notes` service on path `/transaction-notes`
const createService = require('feathers-mongoose')
const hooks = require('./transaction-notes.hooks')
const createModel = require('./transaction-notes.model')
const filters = require('./transaction-notes.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'transaction-notes',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/transaction-notes', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('transaction-notes')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
