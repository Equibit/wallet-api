const { authenticate } = require('feathers-authentication').hooks
const { disallow } = require('feathers-hooks-common')
const encryptIdentifier = require('./hook.encrypt-identifier')

module.exports = function (app) {
  return {
    before: {
      all: [
        disallow('external'),
        authenticate('jwt')
      ],
      find: [],
      get: [],
      create: [
        encryptIdentifier({ key: app.get('addressMapEncryptionKey') })
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
