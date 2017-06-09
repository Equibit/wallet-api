// Initializes the `listunspent` service on path `/listunspent`
const createService = require('./listunspent.class.js')
const hooks = require('./listunspent.hooks')
const filters = require('./listunspent.filters')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'listunspent',
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/listunspent', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('listunspent')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
