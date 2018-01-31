const { authenticate } = require('feathers-authentication').hooks
const { discard, iff, isProvider } = require('feathers-hooks-common')
const idRequired = require('../../hooks/hook.id-required')
const findAddressMap = require('../../hooks/find-address-map')

module.exports = function (app) {
  return {
    before: {
      all: [
        authenticate('jwt')
      ],
      find: [],
      get: [],
      create: [],
      update: [
        iff(
          isProvider('external'),
          idRequired()
        )
      ],
      patch: [
        iff(
          isProvider('external'),
          idRequired()
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
