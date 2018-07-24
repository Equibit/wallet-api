// Initializes the `referral-info` service on path `/referral-info`
const createService = require('feathers-mongoose')
const createModel = require('./referral-info.model')
const hooks = require('./referral-info.hooks')
const filters = require('./referral-info.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'referral-info',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/referral-info', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('referral-info')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
