// Initializes the `user-answers` service on path `/user-answers`
const createService = require('feathers-mongoose')
const createModel = require('./user-answers.model')
const hooks = require('./user-answers.hooks')
const filters = require('./user-answers.filters')
module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')
  const options = {
    name: 'user-answers',
    Model,
    paginate
  }
   // Initialize our service with any options it requires
  app.use('/user-answers', createService(options))
   // Get our initialized service so that we can register hooks and filters
  const service = app.service('user-answers')
  service.hooks(hooks(app))
  if (service.filter) {
    service.filter(filters)
  }
}
