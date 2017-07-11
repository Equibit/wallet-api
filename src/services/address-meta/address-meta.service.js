// Initializes the `address-meta` service on path `/address-meta`
const createService = require('feathers-mongoose')
const createModel = require('../../models/address-meta.model')
const hooks = require('./address-meta.hooks')
const filters = require('./address-meta.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'address-meta',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/address-meta', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('address-meta')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
