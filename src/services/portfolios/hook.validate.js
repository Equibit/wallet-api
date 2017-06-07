const errors = require('feathers-errors')

module.exports = function () {
  return function validatePortfolios (context) {
    if (context.data.hasOwnProperty('balance')) {
      return Promise.reject(new errors.BadRequest('`balance` cannot be manually adjusted.'))
    }
  }
}
