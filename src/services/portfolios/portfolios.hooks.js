const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser, restrictToOwner } = require('feathers-authentication-hooks')
const validate = require('./hook.validate')
const getNextIndex = require('./hook.get-next-index')
const calculateBalance = require('./hook.calculate-balance')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const { discard } = require('feathers-hooks-common')

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
      associateCurrentUser({ idField: '_id', as: 'userId' }),
      getNextIndex(),
      validate()
    ],
    update: [
      mapUpdateToPatch()
    ],
    patch: [ ...restrict ],
    remove: [ ...restrict ]
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
