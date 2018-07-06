
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
                const pair = bitcoin.ECPair.makeRandom()
                const address = pair.getAddress()
                const key = pair.toWIF()
                console.log(address)// 1FkKMsKNJqWSDvTvETqcCeHcUQQ64kSC6s
                console.log(key)// 1FkKMsKNJqWSDvTvETqcCeHcUQQ64kSC6s
                hook.data = {
                  address,
                  key,
                }
              }
            }
          )
        }
      ],
      update: [],
      patch: [],
      remove: []
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
