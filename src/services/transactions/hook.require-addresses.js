const errors = require('feathers-errors')

module.exports = function () {
  return function requireAddresses (context) {
    // params.addresses are required
    if (!context.params.addresses || !context.params.addresses.$in.length) {
      return Promise.reject(new errors.BadRequest('You must query with `addresses: {$in: [addresses]}`'))
    } else {
      return Promise.resolve(context)
    }
  }
}
