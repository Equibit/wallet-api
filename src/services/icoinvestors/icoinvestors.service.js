'use strict'

// Initializes the `icoinvestors` service on path `/icoinvestors`
const createService = require('feathers-mongoose')
const createModel = require('./icoinvestors.model')
const hooks = require('./icoinvestors.hooks')
const filters = require('./icoinvestors.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'icoinvestors',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/icoinvestors', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('icoinvestors')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
