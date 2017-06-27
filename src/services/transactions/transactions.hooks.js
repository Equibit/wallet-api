const { authenticate } = require('feathers-authentication').hooks
const { iff, isProvider, discard } = require('feathers-hooks-common')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const decodeRawTxn = require('./hook.decode-raw-txn')
const validateDecodedTxn = require('./hook.validate-txn')
const sendRawTxn = require('./hook.send-raw-txn')
const formatTxn = require('./hook.format-txn')
const createReceiverTxn = require('./hook.create-receiver-txn')

module.exports = app => {
  return {
    before: {
      all: [ authenticate('jwt') ],
      find: [],
      get: [],
      create: [
        iff(
          isProvider('external'),
          // turn a transaction hex into transaction details.
          decodeRawTxn(app.get('bitcoinCore')),
          /*
          Since `address` and `otherAddress` must be sent from the
          client, we must make sure that they both appear in
          the decoded output. If they don't match, we shouldn't allow
          the transaction to go to the core, or the wallet-api db
          will not match the transaction on the core. Additional RPCs
          will be made to derive the from `address` from each vin's
          `txid` and `vout` property. The responses will be cached on the hook context for use in formatTxn.
          */
          validateDecodedTxn(app.get('bitcoinCore')),

          // Record the transaction in the core
          sendRawTxn(app.get('bitcoinCore')),

          // Set the createReceiverTxn flag so that the createReceiverTxn will create the other txn.
          context => {
            context.data.createReceiverTxn = true
          },

          // Format the transaction to be saved in the wallet-api db
          formatTxn()
        )
      ],
      update: [
        mapUpdateToPatch()
      ],
      patch: [],
      remove: []
    },

    after: {
      all: [ discard('__v') ],
      find: [],
      get: [],
      create: [
        // Creates a separate txn for the receiver's address
        createReceiverTxn()
      ],
      update: [],
      patch: [],
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
