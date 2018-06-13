const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser, restrictToOwner } = require('feathers-authentication-hooks')
const validate = require('./hooks/hook.validate')
const getNextIndex = require('./hooks/hook.get-next-index')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const { discard, disallow, keep, iff, isProvider } = require('feathers-hooks-common')

const restrict = [
  restrictToOwner({
    idField: '_id',
    ownerField: 'userId'
  })
]

module.exports = {
  before: {
    all: [
      authenticate('jwt')
    ],
    find: [ ...restrict ],
    get: [ ...restrict ],
    create: [
      validate(),
      iff(isProvider('external'), keep('name')),
      associateCurrentUser({ idField: '_id', as: 'userId' }),
      getNextIndex()
    ],
    update: [
      mapUpdateToPatch()
    ],
    patch: [ iff(isProvider('external'), keep('name')), ...restrict ],
    remove: [ disallow('external') ]
  },

  after: {
    all: [
      discard('__v')
    ],
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
