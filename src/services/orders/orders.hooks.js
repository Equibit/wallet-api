const { authenticate } = require('feathers-authentication').hooks
const { discard, iff, isProvider, stashBefore } = require('feathers-hooks-common')
const idRequired = require('../../hooks/hook.id-required')
const addSellIssuanceDataToParams = require('../../hooks/hook.add-sell-issuance-data-to-params')
const allowCancel = require('./hooks/hook.allow-cancel')
const errors = require('feathers-errors')
// todo: discard userId if its different from current user

module.exports = function (app) {
  return {
    before: {
      // Note: Order Book is public for viewing.
      all: [],
      find: [],
      get: [],
      create: [
        authenticate('jwt'),
        iff(
          isProvider('external'),
          iff(
            // if create data type is SELL
            context => {
              const { data } = context
              const assetType = data && data.assetType
              const type = (data && data.type) || ''

              return assetType === 'ISSUANCE' && type.toUpperCase() === 'SELL'
            },
            addSellIssuanceDataToParams(app),
            context => {
              const { params, data } = context
              const sellIssuanceData = params.sellIssuanceData || {}
              const maxSellQuantity = sellIssuanceData.maxSellQuantity || 0
              const sellQuantity = data.quantity || 0

              if (sellQuantity > maxSellQuantity) {
                return Promise.reject(new errors.BadRequest('Sell Quantity exceeds maximum available'))
              }
              return Promise.resolve(context)
            }
          ),
          iff(
            // if create data type is BUY
            context => {
              const { data } = context
              const assetType = data && data.assetType
              const type = (data && data.type) || ''

              return assetType === 'ISSUANCE' && type.toUpperCase() === 'BUY'
            },
            context => {
              const { data } = context
              const issuancesService = app.service('issuances')
              return issuancesService.find({ query: { _id: data.issuanceId } })
                .then(response => {
                  const issuance = response.data[0] || {}
                  const sharesAuthorized = issuance.sharesAuthorized || 0

                  if (data.quantity > sharesAuthorized) {
                    return Promise.reject(new errors.BadRequest('Buy Quantity exceeds maximum'))
                  }
                  return Promise.resolve(context)
                })
            }
          )
        )
      ],
      update: [
        authenticate('jwt'),
        iff(
          isProvider('external'),
          idRequired(),
          stashBefore(),
          allowCancel(app)
        )
      ],
      patch: [
        authenticate('jwt'),
        iff(
          isProvider('external'),
          idRequired(),
          stashBefore(),
          allowCancel(app)
        )
      ],
      remove: [
        authenticate('jwt'),
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
}
