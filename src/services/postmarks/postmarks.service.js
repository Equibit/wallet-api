'use strict';

// Initializes the `postmarks` service on path `/postmarks`
const createService = require('./postmarks.class.js');
const hooks = require('./postmarks.hooks');
const filters = require('./postmarks.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'postmarks',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/postmarks', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('postmarks');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
