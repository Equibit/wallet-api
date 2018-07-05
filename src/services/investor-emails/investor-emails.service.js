'use strict'

// Initializes the `investor-emails` service on path `/investor-emails`
const createService = require('feathers-mongoose')
const createModel = require('./investor-emails.model')
const hooks = require('./investor-emails.hooks')
const filters = require('./investor-emails.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'investor-emails',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/investor-emails', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('investor-emails')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }
}
