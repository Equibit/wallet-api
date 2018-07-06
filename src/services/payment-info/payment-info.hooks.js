
const { disallow, keep } = require('feathers-hooks-common')
const bitcoin = require('bitcoinjs-lib')

module.exports = function() {
  return {
    before: {
      all: [
        disallow('external')
      ],
      find: [],
      get: [],
      create: [
        // delete all inbound data
        keep(),
        hook => {
          return hook.service.find({ query: {} }).then(
            ({data}) => {
              if (data && data.length) {
                // if there is already a record, don't create a new one
                hook.result = data[0]
              } else {
                // create an address and key
                const pair = bitcoin.ECPair.makeRandom()
                const address = pair.getAddress()
                const key = pair.toWIF()
                hook.data = {
                  address,
                  key,
                }
              }
            }
          )
        }
      ],
      // only a DB operator should be able to take any action which
      // might remove or alter the keys
      update: [
        disallow(),
      ],
      patch: [
        disallow(),
      ],
      remove: [
        disallow(),
      ]
    },

    after: {
      all: [],
      find: [],
      get: [],
      create: [],
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
