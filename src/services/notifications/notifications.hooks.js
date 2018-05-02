const { authenticate } = require('feathers-authentication').hooks
const { iff, keep, isProvider } = require('feathers-hooks-common')

const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const getEventAddress = require('../../hooks/get-event-address')
const requireAddresses = require('./hooks/hook.require-addresses')

module.exports = app => {
  return {
    before: {
      all: [ authenticate('jwt') ],
      find: [
        requireAddresses()
      ],
      get: [],
      create: [],
      update: [mapUpdateToPatch()],
      patch: [
        iff(
          isProvider('external'),
          keep('isRead')
        )
      ],
      remove: []
    },

    after: {
      all: [hook => {
        if (hook.result && !hook.result.data) {
          hook.result.data = {}
        }
        return hook
      }],
      find: [],
      get: [],
      create: [getEventAddress()],
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
