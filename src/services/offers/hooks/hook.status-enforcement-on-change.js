const errors = require('feathers-errors')

/* Rules for Offer.status enforced by hooks:
  // OPEN, htlcStep=1 (default) (set in a create hook)
  TRADING, isAccepted=true, htlcStep=2 to 3
  CLOSED, htlcStep=4
  and allow front to set status to CANCELLED if htlcStep !== 4

  No changes allowed if is already if CLOSED or CANCELLED
*/

// Enforce offer status OPEN on create
module.exports = function (app) {
  return function statusEnforcementOnChange (context) {
    const { data, id, params } = context
    const htlcStep = data && data.htlcStep
    const status = data && data.status
    const statusUC = (status || '').toUpperCase()
    const query = params.query || {}
    const offerId = id || query._id

    return app.service('offers').find({ query: { _id: offerId } })
      .then(response => {
        const offer = response.data[0]
        const currentStatus = offer.status
        const currentHtlcStep = offer.htlcStep || 0

        if (currentStatus === 'CLOSED' || currentStatus === 'CANCELLED') {
          return Promise.reject(new errors.BadRequest('Offer cannot be modified once CLOSED or CANCELLED.'))
        }

        if (htlcStep && (htlcStep < currentHtlcStep)) {
          return Promise.reject(new errors.BadRequest('Offer htlcStep cannot be set to a lower value.'))
        }

        if (htlcStep && (htlcStep - currentHtlcStep) > 1) {
          return Promise.reject(new errors.BadRequest('Offer htlcStep cannot skip values.'))
        }

        // enforce CANCELLED rule (this status is up to the user, the rest are determined by other data):
        if (statusUC === 'CANCELLED') {
          if (htlcStep === 4) {
            // don't let a change of both status and htlcStep to enter the conflicted state
            return Promise.reject(new errors.BadRequest('Offer cannot be CANCELLED when it is CLOSED.'))
          }
          // else the change to CANCELLED is allowed
          return Promise.resolve(context)
        }

        // enforce automatic setting of status
        if (htlcStep >= 4) {
          data.status = 'CLOSED'
        } else if (htlcStep > 1) {
          data.status = 'TRADING'
        } else {
          // don't allow it to change if htlcStep is 1 (OPEN) or isn't specified (patched something else, keep it the same)
          data.status = currentStatus
        }

        return Promise.resolve(context)
      })
  }
}
