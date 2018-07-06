// Initializes the `questionaire` service on path `/questionaire`
const createService = require('feathers-mongoose');
const createModel = require('./questionaire.model');
const hooks = require('./questionaire.hooks');
const filters = require('./questionaire.filters');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'questionaire',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/questionaire', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('questionaire');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
