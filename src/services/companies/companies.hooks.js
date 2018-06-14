const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser } = require('feathers-authentication-hooks')
const { disallow } = require('feathers-hooks-common')
const slugify = require('feathers-slugify')
const assignIndex = require('../../hooks/hook.assign-index')

module.exports = function (app) {
  return {
    before: {
      all: [],
      find: [],
      get: [],
      create: [
        authenticate('jwt'),
        associateCurrentUser({ idField: '_id', as: 'userId' }),
        slugify({ slug: 'name' }),
        assignIndex()
      ],
      update: [
        authenticate('jwt'),
        associateCurrentUser({ idField: '_id', as: 'userId' }),
        slugify({ slug: 'name' })
      ],
      patch: [
        authenticate('jwt'),
        associateCurrentUser({ idField: '_id', as: 'userId' }),
        slugify({ slug: 'name' })
      ],
      remove: [
        disallow('external'),
        authenticate('jwt')
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
      all: [
        error => {
          console.log(error)
        }
      ],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  }
}
