const errors = require('feathers-errors')

module.exports = function () {
  return function requireAddresses (context) {
    // params.addresses are required
    if (!context.params.query.address || !context.params.query.address.$in.length) {
      return Promise.reject(new errors.BadRequest('You must query with `address: {$in: [address]}`'))
    } else {
      return Promise.resolve(context)
    }
  }
}
