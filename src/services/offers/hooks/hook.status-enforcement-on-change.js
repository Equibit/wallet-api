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
    const { data, params, method } = context
    const htlcStep = data && data.htlcStep
    const status = data && data.status
    const statusUC = (status || '').toUpperCase()

    // no need to re-get offer since we use stashBefore earlier in hooks
    // see https://feathers-plus.github.io/v1/feathers-hooks-common/#stashbefore
    const offer = params.before
    const currentStatus = offer.status
    const currentHtlcStep = offer.htlcStep || 0

    if (currentStatus === 'CLOSED') {
      return Promise.reject(new errors.BadRequest('Offer cannot be modified once CLOSED or CANCELLED.'))
    }

    if (currentStatus === 'CANCELLED') {
      // There is one update that is allowed after CANCEL: setting htlcTxId4 and htlcStep to 4
      // -- this will update updatedAt as well; the update data generally does not include createdAt
      Object.keys(offer).concat(Object.keys(data)).forEach(key => {
        const before = offer[key]
        const after = data[key]

        if (
          (method === 'patch' ? typeof after !== 'undefined' : true) &&
          before !== after
        ) {
          if (key === 'updatedAt' || key === 'createdAt') {
            return
          }
          if (key === 'htlcTxId4' && typeof before === 'undefined') {
            return
          }
          if (key === 'htlcStep' &&
            before && before.toString(10) === '3' &&
            after && after.toString(10) === '4'
          ) {
            return
          }
          throw new errors.BadRequest('Offer cannot be modified once CLOSED or CANCELLED.')
        }
      })
      return context
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
  }
}
