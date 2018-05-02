const errors = require('feathers-errors')

module.exports = function () {
  return function requireAddresses (context) {
    // params.addresses are required
    const { query } = context.params
    let fromAddress = query.fromAddress
    let toAddress = query.toAddress
    if (Array.isArray(query.$or)) {
      query.$or.forEach(clause => {
        if (clause.fromAddress) {
          fromAddress = fromAddress || clause.fromAddress
        } else if (clause.toAddress) {
          toAddress = toAddress || clause.toAddress
        } else {
          Promise.reject(new errors.BadRequest('Your query must not have an $or clause with neither `fromAddress` nor `toAddress`'))
        }
      })
    }
    if ((!fromAddress || !fromAddress.$in || !fromAddress.$in.length) &&
      (!toAddress || !toAddress.$in || !toAddress.$in.length)
    ) {
      return Promise.reject(new errors.BadRequest('You must query with `fromAddress: {$in: [address]}` and/or `toAddress: {$in: [address]}`'))
    } else {
      return Promise.resolve(context)
    }
  }
}
