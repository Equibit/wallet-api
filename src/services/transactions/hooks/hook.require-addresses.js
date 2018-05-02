const errors = require('feathers-errors')

module.exports = function () {
  return function requireAddresses (context) {
    // params.addresses are required
    const { query } = context.params
    const fromAddress = query.fromAddress || (query.$or && query.$or.fromAddress)
    const toAddress = query.toAddress || (query.$or && query.$or.toAddress)
    if ((!fromAddress || !fromAddress.$in || !fromAddress.$in.length) &&
      (!toAddress || !toAddress.$in || !toAddress.$in.length)
    ) {
      return Promise.reject(new errors.BadRequest('You must query with `fromAddress: {$in: [address]}` and/or `toAddress: {$in: [address]}`'))
    } else {
      return Promise.resolve(context)
    }
  }
}
