const { discard, iff, isProvider } = require('feathers-hooks-common')

const idRequired = require('../../hooks/hook.id-required')

// todo: discard userId if its different from current user

module.exports = {
  before: {
    all: [],
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
