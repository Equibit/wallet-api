const { authenticate } = require('feathers-authentication').hooks
const { discard, iff, isProvider, stashBefore, keep, disallow } = require('feathers-hooks-common')
const idRequired = require('../../hooks/hook.id-required')
const { restrictToOwner } = require('feathers-authentication-hooks')
// const addSellIssuanceDataToParams = require('../../hooks/hook.add-sell-issuance-data-to-params')
const allowCancel = require('./hooks/hook.allow-cancel')
const errors = require('feathers-errors')
// todo: discard userId if its different from current user

module.exports = function (app) {
  const authorizeCheckHook = [
    iff(
      isProvider('external'),
      iff(
        context => context.params.accessToken || (context.params.headers && context.params.headers.authorization),
        authenticate('jwt')
      ))
  ]

  return {
    before: {
      // Note: Order Book is public for viewing.
      all: [],
      find: authorizeCheckHook,
      get: authorizeCheckHook,
      create: [
        authenticate('jwt'),
        iff(
          isProvider('external'),
          keep('portfolioId', 'type', 'assetType', 'timelock', 'quantity', 'price', 'isFillOrKill', 'goodFor', 'issuanceId', 'issuanceAddress'),
          context => {
            context.data.status = 'OPEN'
            context.data.userId = context.params.user._id.toString()
            return Promise.resolve(context)
          },
          // disabling this for now, backend cannot track or enforce this if trades happen outside of the system
          // must trust the utxo from the front end user.
          // iff(
          //   // if create data type is SELL
          //   context => {
          //     const { data } = context
          //     const assetType = data && data.assetType
          //     const type = (data && data.type) || ''
          //
          //     return assetType === 'ISSUANCE' && type.toUpperCase() === 'SELL'
          //   },
          //   addSellIssuanceDataToParams(app),
          //   context => {
          //     const { params, data } = context
          //     const sellIssuanceData = params.sellIssuanceData || {}
          //     const maxSellQuantity = sellIssuanceData.maxSellQuantity || 0
          //     const sellQuantity = data.quantity || 0
          //
          //     if (sellQuantity > maxSellQuantity) {
          //       return Promise.reject(new errors.BadRequest('Sell Quantity exceeds maximum available'))
          //     }
          //     return Promise.resolve(context)
          //   }
          // ),
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
        restrictToOwner({ idField: '_id', ownerField: 'userId' }),
        iff(
          isProvider('external'),
          keep('status'),
          idRequired(),
          stashBefore(),
          allowCancel(app)
        )
      ],
      patch: [
        authenticate('jwt'),
        restrictToOwner({ idField: '_id', ownerField: 'userId' }),
        iff(
          isProvider('external'),
          keep('status'),
          idRequired(),
          stashBefore(),
          allowCancel(app)
        )
      ],
      remove: [
        disallow('external'),
        authenticate('jwt')
      ]
    },

    after: {
      all: [
        discard('__v')
      ],
      find: [
        iff(
          isProvider('external'),
          iff(
            context => context.params.authenticated,
            context => {
              const { result, params } = context
              result.data.forEach(order => {
                if (order.userId.toString() !== params.user._id.toString()) order.userId = undefined
              })
              return Promise.resolve(context)
            }).else(discard('userId')))],
      get: [
        iff(
          isProvider('external'),
          iff(
            context => context.params.authenticated,
            context => {
              const { result, params } = context
              if (result.userId.toString() !== params.user._id.toString()) context.result.userId = undefined
              return Promise.resolve(context)
            }
          ).else(discard('userId')))],
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
