const { authenticate } = require('feathers-authentication').hooks
const { disallow, iff, isProvider, keep } = require('feathers-hooks-common')
const { restrictToOwner, associateCurrentUser } = require('feathers-authentication-hooks')
const idRequired = require('../../hooks/hook.id-required')
const assignIndex = require('../../hooks/hook.assign-index')
const associateCompany = require('./hooks/hook.company-details')
const updateTransaction = require('../transactions/hooks/hook.update-transaction')

module.exports = function (app) {
  return {
    before: {
      all: [
        // call the authenticate hook before every method except 'create'
        iff(
          (hook) => hook.method !== 'get' && hook.method !== 'find',
          iff(
            isProvider('external'),
            authenticate('jwt')
          )
        )
      ],
      find: [],
      get: [],
      create: [
        iff(
          isProvider('external'),
          keep(
            'issuanceTxId',
            'issuanceAddress',
            'companyIndex',
            'companyId',
            'companyName',
            'companySlug',
            'domicile',
            'issuanceName',
            'issuanceType',
            'restriction',
            'sharesAuthorized'
          ),
          associateCurrentUser({ idField: '_id', as: 'userId' }),
          assignIndex(),
          associateCompany()
        )
      ],
      update: [
        iff(
          isProvider('external'),
          idRequired()
        )
      ],
      patch: [
        iff(
          isProvider('external'),
          idRequired(),
          restrictToOwner({ idField: '_id', ownerField: 'userId' }),
          keep('name')
        )
      ],
      remove: [
        disallow('external')
      ]
    },

    after: {
      all: [],
      find: [],
      get: [],
      create: [
        updateTransaction({
          txIdPath: 'result.issuanceTxId',
          fieldsToUpdate: {
            issuanceId: 'result._id',
            issuanceName: 'result.issuanceName',
            issuanceType: 'result.issuanceType',
            issuanceUnit: () => 'SHARES'
          }
        })
      ],
      update: [],
      patch: [],
      remove: []
    },

    error: {
      all: [
        // error => {
        //   console.log(error)
        // }
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
