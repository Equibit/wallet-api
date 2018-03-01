const errors = require('feathers-errors')

// makes sure important related data is present under certain conditions
module.exports = function () {
  return function conditionalRequirements (context) {
    const { data } = context
    const { type, issuanceId, offerId, costPerShare } = data

    if (type === 'CANCEL' && !issuanceId) {
      return Promise.reject(new errors.BadRequest('issuanceId required for CANCEL transaction'))
    }

    if (offerId && typeof costPerShare === 'undefined') {
      return Promise.reject(new errors.BadRequest('Transactions tied to offers must include the offer price as "costPerShare"'))
    }

    return Promise.resolve(context)
  }
}
