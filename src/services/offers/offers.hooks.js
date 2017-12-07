const { authenticate } = require('feathers-authentication').hooks
const { discard } = require('feathers-hooks-common')
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
      update: [],
      patch: [],
      remove: []
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
          from: 'params.data.btcAddress'
        }),
        findAddressMap({
          key: app.get('addressMapEncryptionKey'),
          from: 'params.data.eqbAddress'
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
