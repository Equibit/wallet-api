const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser, restrictToOwner } = require('feathers-authentication-hooks')
const { disallow, keep, discard, iff, isProvider } = require('feathers-hooks-common')
const slugify = require('feathers-slugify')
const assignIndex = require('./hooks/hook.assign-index')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')

module.exports = function (app) {
  return {
    before: {
      all: [],
      find: [],
      get: [],
      create: [
        authenticate('jwt'),
        keep(
          'index',
          'name',
          'registrationNumber',
          'domicile',
          'state'
        ),
        associateCurrentUser({ idField: '_id', as: 'userId' }),
        slugify({ slug: 'name' }),
        assignIndex()
      ],
      update: [
        mapUpdateToPatch()
      ],
      patch: [
        authenticate('jwt'),
        keep(
          'name',
          'registrationNumber',
          'domicile',
          'state'
        ),
        restrictToOwner({ idField: '_id', ownerField: 'userId' }),
        slugify({ slug: 'name' })
      ],
      remove: [
        disallow('external'),
        authenticate('jwt')
      ]
    },

    after: {
      all: [],
      find: [
        iff(
          isProvider('external'),
          iff(
            context => {
              return true //TODO: Return false if owner
            },
            discard('index', 'userId')
          )
        )
      ],
      get: [
        iff(
          isProvider('external'),
          iff(
            context => {
              return true //TODO: Return false if owner
            },
            discard('index', 'userId')
          )
        )
      ],
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
