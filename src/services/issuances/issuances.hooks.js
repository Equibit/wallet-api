// const { authenticate } = require('feathers-authentication').hooks;
const { disallow, iff, isProvider } = require('feathers-hooks-common')
const idRequired = require('../../hooks/hook.id-required')
const updateTransaction = require('../transactions/hooks/hook.update-transaction')

module.exports = function (app) {
  return {
    before: {
      all: [
        // call the authenticate hook before every method except 'create'
        // iff(
        //   (hook) => hook.method !== 'create' || !hook.params.internal,
        //   authenticate('jwt')
        // )
      ],
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
