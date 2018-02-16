const errors = require('feathers-errors')

// Enforce offer status OPEN on create
module.exports = function () {
  return function statusOnCreateIsOPEN (context) {
    const { data } = context
    const status = data.status
    const htlcStep = data.htlcStep

    // if it's already set and it's set to something wrong, reject
    if (status && status.toUpperCase() !== 'OPEN') {
      return Promise.reject(new errors.BadRequest('Offer status must be `OPEN` on create'))
    }
    if (htlcStep && htlcStep !== 1) {
      return Promise.reject(new errors.BadRequest('Offer htlcStep must be 1 on create'))
    }

    // set it to OPEN by default
    data.status = 'OPEN'
    data.htlcStep = 1

    return Promise.resolve(context)
  }
}
