const errors = require('feathers-errors')
const { isProvider } = require('feathers-hooks-common')

module.exports = function () {
  return function validatePortfolios (context) {
    if (isProvider('external')(context) && context.data.hasOwnProperty('balance')) {
      return Promise.reject(new errors.BadRequest('`balance` cannot be manually adjusted.'))
    }
  }
}
