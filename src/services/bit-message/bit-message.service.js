// Initializes the `bit-message` service on path `/bit-message`
const createService = require('./bit-message.class.js')
const hooks = require('./bit-message.hooks')
const filters = require('./bit-message.filters')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'bit-message',
    paginate,
    app
  }

  // Initialize our service with any options it requires
  app.use('/bit-message', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('bit-message')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
