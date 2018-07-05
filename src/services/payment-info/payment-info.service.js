'use strict'

// Initializes the `payment-info` service on path `/payment-info`
const createService = require('feathers-mongoose');
const createModel = require('./payment-info.model')
const hooks = require('./payment-info.hooks');

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate');

  const options = {
    name: 'payment-info',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/payment-info', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('payment-info');
  service.hooks(hooks(app))
};
