// Initializes the `twitter-campaign` service on path `/twitter-campaign`
const createService = require('feathers-mongoose')
const createModel = require('./twitter-campaign.model')
const hooks = require('./twitter-campaign.hooks')
const filters = require('./twitter-campaign.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'twitter-campaign',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/twitter-campaign', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('twitter-campaign')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
