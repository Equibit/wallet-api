const { authenticate } = require('feathers-authentication').hooks
const { iff, isProvider, discard } = require('feathers-hooks-common')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const decodeRawTxn = require('./hooks/hook.decode-raw-txn')
const validateDecodedTxn = require('./hooks/hook.validate-txn')
const sendRawTxn = require('./hooks/hook.send-raw-txn')
const formatTxn = require('./hooks/hook.format-txn')
const createReceiverTxn = require('./hooks/hook.create-receiver-txn')
const requireAddresses = require('./hooks/hook.require-addresses')
const findAddressMap = require('./hooks/hook.find-address-map')
const defaultSort = require('./hooks/hook.default-sort')

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

          // Set the createReceiverTxn flag so that the createReceiverTxn will create the other txn.
          context => {
            if (['OUT', 'BUY', 'SELL'].indexOf(context.data.type) !== -1) {
              context.data.createReceiverTxn = true
            }
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
