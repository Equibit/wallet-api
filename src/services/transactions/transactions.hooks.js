const { authenticate } = require('feathers-authentication').hooks
const { iff, isProvider, discard } = require('feathers-hooks-common')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const decodeRawTxn = require('./hook.decode-raw-txn')
const validateDecodedTxn = require('./hook.validate-txn')
const sendRawTxn = require('./hook.send-raw-txn')
const formatTxn = require('./hook.format-txn')
const createReceiverTxn = require('./hook.create-receiver-txn')
const requireAddresses = require('./hook.require-addresses')
const findAddressMap = require('./hook.find-address-map')
const defaultSort = require('./hook.default-sort')

module.exports = app => {
  const coreParams = {
    btc: app.get('bitcoinCore'),
    eqb: app.get('equibitCore')
  }
  return {
    before: {
      all: [ authenticate('jwt') ],
      find: [
        requireAddresses(),
        defaultSort()
      ],
      get: [],
      create: [
        iff(
          isProvider('external'),
          // turn a transaction hex into transaction details.
          decodeRawTxn(coreParams),
          /*
          Since `address` and `otherAddress` must be sent from the
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
        createReceiverTxn(),
        // adds the matching /address-map record to the hook params for use in filters
        findAddressMap({ key: app.get('addressMapEncryptionKey') })
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
