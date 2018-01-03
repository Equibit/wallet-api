const { authenticate } = require('feathers-authentication').hooks
const { disallow } = require('feathers-hooks-common')
const encryptIdentifier = require('./hooks/hook.encrypt-identifier')
const mapCreateToUpsert = require('./hooks/hook.map-create-to-upsert')

module.exports = function (app) {
  return {
    before: {
      all: [
        disallow('external'),
        authenticate('jwt')
      ],
      find: [
        disallow('external')
      ],
      get: [
        disallow()
      ],
      create: [
        mapCreateToUpsert(context => {
          const { data } = context
          return { address: data.address }
        })
      ],
      update: [
        disallow('external')
      ],
      patch: [
        disallow('external'),
        encryptIdentifier({ key: app.get('addressMapEncryptionKey') })
      ],
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
