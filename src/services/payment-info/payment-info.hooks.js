
const { disallow, keep } = require('feathers-hooks-common')

module.exports = function(app) {
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
                console.log('A')
                hook.result = data[0]
              } else {
                // generate the address and the keys
                console.log('B')
                hook.data = {
                  address: 'David made a address',
                  key: 'David made a key',
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
