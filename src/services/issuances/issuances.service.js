'use strict';

// Initializes the `issuances` service on path `/issuances`
const createService = require('feathers-mongoose');
const createModel = require('../../models/issuances.model');
const hooks = require('./issuances.hooks');
const filters = require('./issuances.filters');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'issuances',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/issuances', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('issuances');

  service.hooks(hooks(app));

  if (service.filter) {
    service.filter(filters);
  }
};
