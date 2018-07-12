// Initializes the `referral-codes` service on path `/referral-codes`
const createService = require('feathers-mongoose')
const createModel = require('./referral-codes.model')
const hooks = require('./referral-codes.hooks')
const filters = require('./referral-codes.filters')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'referral-codes',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/referral-codes', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('referral-codes')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
