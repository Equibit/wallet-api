// Initializes the `payment-info` service on path `/payment-info`
const createService = require('feathers-mongodb');
const hooks = require('./payment-info.hooks');

module.exports = function (app) {
  const paginate = app.get('paginate');
  const mongoClient = app.get('mongoClient');
  const options = { paginate };

  // Initialize our service with any options it requires
  app.use('/payment-info', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('payment-info');

  mongoClient.then(db => {
    service.Model = db.collection('payment-info');
  });

  service.hooks(hooks);
};
