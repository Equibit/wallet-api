const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser, restrictToOwner } = require('feathers-authentication-hooks')
const { disallow, keep, iff, isProvider, discard } = require('feathers-hooks-common')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')

const restrict = [
  restrictToOwner({
    idField: '_id',
    ownerField: 'userId'
  })
]

module.exports = function (app) {
  return {
    before: {
      all: [
        authenticate('jwt')
      ],
      find: [ ...restrict ],
      get: [ ...restrict ],
      create: [
        iff(isProvider('external'), keep('name')),
        associateCurrentUser({ idField: '_id', as: 'userId' })
      ],
      update: [
        mapUpdateToPatch()
      ],
      patch: [
        iff(isProvider('external'), keep('name'), ...restrict)
      ],
      remove: [
        disallow('external')
      ]
    },

    after: {
      all: [discard('__v')],
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
