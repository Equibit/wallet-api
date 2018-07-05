
const { disallow, keep } = require('feathers-hooks-common')

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
                // generate the address and the keys
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
