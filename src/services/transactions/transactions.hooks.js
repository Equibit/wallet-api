const { authenticate } = require('feathers-authentication').hooks
const { iff, isProvider, discard, disallow } = require('feathers-hooks-common')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const decodeRawTxn = require('./hooks/hook.decode-raw-txn')
const validateDecodedTxn = require('./hooks/hook.validate-txn')
const sendRawTxn = require('./hooks/hook.send-raw-txn')
const formatTxn = require('./hooks/hook.format-txn')
const requireAddresses = require('./hooks/hook.require-addresses')
const getEventAddress = require('../../hooks/get-event-address')
const defaultSort = require('./hooks/hook.default-sort')
const conditionalRequirements = require('./hooks/hook.conditional-requirements')
const createNotification = require('../../hooks/create-notification')
const updateOfferExpiration = require('./hooks/hook.update-offer-expiration')

module.exports = app => {
  const coreParams = {
    btc: app.get('bitcoinCore'),
    eqb: app.get('equibitCore')
  }
  return {
    before: {
      all: [ authenticate('jwt') ],
      find: [
        iff(
          isProvider('external'),
          requireAddresses()
        ),
        defaultSort()
      ],
      get: [],
      create: [
        conditionalRequirements(),
        iff(
          isProvider('external'),
          // turn a transaction hex into transaction details.
          decodeRawTxn(coreParams),
          /*
          Since `fromAddress` and `toAddress` must be sent from the
          client, we must make sure that they both appear in
          the decoded output. If they don't match, we shouldn't allow
          the transaction to go to the core, or the wallet-api db
          will not match the transaction on the core. Additional RPCs
          will be made to derive the from `address` from each vin's
          `txid` and `vout` property. The responses will be cached on the hook context for use in formatTxn.
          */
          validateDecodedTxn(coreParams),

          // Record the transaction in the core
          sendRawTxn(coreParams),

          // Format the transaction to be saved in the wallet-api db
          formatTxn(),

          // Create the transaction description via the transaction-notes service
          hook => {
            return Promise.all([
              hook.app.service('transaction-notes').create({
                txId: hook.data.txId,
                address: hook.data.fromAddress,
                description: hook.data.description
              }),
              hook.app.service('transaction-notes').create({
                txId: hook.data.txId,
                address: hook.data.toAddress,
                description: hook.data.description
              })
            ]).then(() => hook)
          },
          discard('description')
        )
      ],
      update: [
        mapUpdateToPatch()
      ],
      patch: [
        disallow('external')
      ],
      remove: []
    },

    after: {
      all: [ discard('__v') ],
      find: [],
      get: [],
      create: [
        // Patch any related issuance if type is CANCEL to decrease the 'sharesIssued' number
        context => {
          const transaction = context.result || {}
          const { type, issuanceId, amount } = transaction
          const issuancesService = app.service('issuances')
          // if cancelling an issuance (blanking the eqb), then the shares authorized should be decreased by amount
          if (type === 'CANCEL' && issuanceId && amount) {
            // $inc increases the value that's on the record atomicly (so don't need to worry about other changes at the same time)
            // patching { sharesIssued: issuance.sharesIssued - amount } is dangerous if issuance changed between a fetch and the patch
            // https://docs.mongodb.com/manual/reference/operator/update/inc/ (inc by negative is a decrease)
            return issuancesService.patch(issuanceId, { $inc: { sharesAuthorized: -amount } })
              .then(patchResponse => {
                if (patchResponse.sharesAuthorized <= 0) {
                  return issuancesService.patch(issuanceId, { $set: { isCancelled: true } })
                }
              })
              .then(() => Promise.resolve(context))
          } else if (issuanceId && amount) {
            return issuancesService.get(issuanceId).then(issuance => {
              if (issuance.issuanceAddress === transaction.toAddress) {
                return issuancesService.patch(issuanceId, { $inc: { sharesIssued: -amount } })
              }
              if (issuance.issuanceAddress === transaction.fromAddress) {
                return issuancesService.patch(issuanceId, { $inc: { sharesIssued: amount } })
              }
            }).then(patchResponse => Promise.resolve(context))
          }

          return Promise.resolve(context)
        },
        // adds the matching /address-map record to the hook params for use in filters
        getEventAddress(),
        iff(
          hook => hook.data.type === 'TRANSFER',
          createNotification({
            type: 'transaction',
            addressPath: 'result.toAddress',
            fields: {
              type: 'result.type',
              address: 'result.toAddress',
              amount: 'result.amount',
              issuanceType: 'result.issuanceType',
              currencyType: 'result.currencyType',
              transactionId: 'result.txId'
            }
          })
        )
      ],
      update: [
        getEventAddress()
      ],
      patch: [
        // Update offer if transaction is either htlc1 or htlc2 of the offer:
        updateOfferExpiration(),
        getEventAddress()
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
