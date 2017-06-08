const { authenticate } = require('feathers-authentication').hooks
const { restrictToOwner } = require('feathers-authentication-hooks')

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [
      restrictToOwner({ idField: '_id', ownerField: 'userId' })
    ],
    get: [
      restrictToOwner({ idField: '_id', ownerField: 'userId' })
    ],
    create: [],
    update: [
      restrictToOwner({ idField: '_id', ownerField: 'userId' })
    ],
    patch: [
      restrictToOwner({ idField: '_id', ownerField: 'userId' })
    ],
    remove: [
      restrictToOwner({ idField: '_id', ownerField: 'userId' })
    ]
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
