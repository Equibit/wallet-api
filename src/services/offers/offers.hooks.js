const { authenticate } = require('feathers-authentication').hooks
const { discard, iff, isProvider } = require('feathers-hooks-common')
const idRequired = require('../../hooks/hook.id-required')
const findAddressMap = require('../../hooks/find-address-map')
const statusOnCreateIsOPEN = require('./hooks/hook.status-on-create-is-open')
const statusEnforcementOnChange = require('./hooks/hook.status-enforcement-on-change')
const patchSharesIssuedAfterClosed = require('./hooks/hook.patch-shares-issued-after-closed')

/* Rules for Offer.status enforced by hooks:
  OPEN, htlcStep=1 (default)
  TRADING, isAccepted=true, htlcStep=2 to 3
  CLOSED, htlcStep=4
  and allow front to set status to CANCELLED if htlcStep !== 4

  No changes allowed if is already CLOSED or CANCELLED
*/

module.exports = function (app) {
  return {
    before: {
      all: [
        authenticate('jwt')
      ],
      find: [],
      get: [],
      create: [
        iff(
          isProvider('external'),
          statusOnCreateIsOPEN()
        )
      ],
      update: [
        iff(
          isProvider('external'),
          idRequired(),
          statusEnforcementOnChange(app)
        )
      ],
      patch: [
        iff(
          isProvider('external'),
          idRequired(),
          statusEnforcementOnChange(app)
        )
      ],
      remove: [
        iff(
          isProvider('external'),
          idRequired()
        )
      ]
    },

    after: {
      all: [
        discard('__v')
      ],
      find: [],
      get: [],
      create: [
        findAddressMap({
          key: app.get('addressMapEncryptionKey'),
          from: 'data.btcAddress'
        }),
        findAddressMap({
          key: app.get('addressMapEncryptionKey'),
          from: 'data.eqbAddress'
        })
      ],
      update: [
        patchSharesIssuedAfterClosed(app)
      ],
      patch: [
        patchSharesIssuedAfterClosed(app)
      ],
      remove: []
    },

    error: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  }
}
