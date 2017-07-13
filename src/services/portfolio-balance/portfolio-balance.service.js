// Initializes the `portfolio-balance` service on path `/portfolio-balance`
const createService = require('./portfolio-balance.class.js');
const hooks = require('./portfolio-balance.hooks');
const filters = require('./portfolio-balance.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'portfolio-balance',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/portfolio-balance', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('portfolio-balance');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
