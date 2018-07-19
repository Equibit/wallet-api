const { authenticate } = require('feathers-authentication').hooks
const { associateCurrentUser } = require('feathers-authentication-hooks')
const { discard, keep, iff, isProvider, stashBefore, unless } = require('feathers-hooks-common')
const idRequired = require('../../hooks/hook.id-required')
const getEventAddress = require('../../hooks/get-event-address')
const createNotification = require('../../hooks/create-notification')
const statusOnCreateIsOPEN = require('./hooks/hook.status-on-create-is-open')
const statusEnforcementOnChange = require('./hooks/hook.status-enforcement-on-change')
// const addSellIssuanceDataToParams = require('../../hooks/hook.add-sell-issuance-data-to-params')
const blockOfferAcceptance = require('./hooks/hook.block-offer-acceptance')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const errors = require('feathers-errors')
const updateTransaction = require('../transactions/hooks/hook.update-transaction')

/* Rules for Offer.status enforced by hooks:
  OPEN, htlcStep=1 (default)
  TRADING, isAccepted=true, htlcStep=2 to 3
  CLOSED, htlcStep=4
  and allow front to set status to CANCELLED if htlcStep !== 4

  No changes allowed if is already CLOSED or CANCELLED
*/

module.exports = function (app) {
  const postUpdateHooks = [
    getEventAddress({
      from: 'data.btcAddress'
    }),
    getEventAddress({
      from: 'data.eqbAddress'
    }),
    iff(
      // if the htlcStep or status of the offer was updated
      hook => hook.result.htlcStep !== hook.params.before.htlcStep ||
                hook.result.status !== hook.params.before.status,
      hook => {
        // update made by the offer holder.
        // Notify the order creator.
        return app.service('/orders').get({
          _id: hook.result.orderId
        }).then(order => {
          hook.params.order = order
          if (hook.result.status === 'CANCELLED') {
            // assume htlcStep === either 3 or 4
            return app.service('/transactions').find({
              query: {
                txId: hook.result.htlcStep === 3 ? hook.result.htlcTxId3 : hook.result.htlcTxId4
              }
            }).then(txes => {
              const tx = txes.data[0]
              if (tx) {
                if (tx.toAddress === hook.result.eqbAddress || tx.toAddress === hook.result.btcAddress) {
                  hook.notificationAddress = hook.params.order.eqbAddress
                } else {
                  hook.notificationAddress = hook.result.eqbAddress
                }
              }
              return hook
            })
          } else {
            if (hook.result.htlcStep === 3) {
              if (hook.result.type === 'BUY') {
                hook.notificationAddress = order.btcAddress
              } else {
                hook.notificationAddress = order.eqbAddress
              }
            } else {
              // these updates (steps 2 or 4) were made by the order holder.
              // Notify the offer creator
              hook.notificationAddress = hook.result.eqbAddress
              if (hook.result.isAccepted && order.isFillOrKill) {
                return app.service('/orders').patch(hook.result.orderId, {
                  status: 'CLOSED'
                }).then(() => hook)
              }
            }
            return hook
          }
        })
      },
      createNotification({
        type: 'offer',
        addressPath: 'notificationAddress',
        fields: {
          offerId: 'result._id',
          orderId: 'result.orderId',
          type: 'result.type',
          assetType: 'result.assetType',
          status: 'result.status',
          action: hook => {
            const offerStatus = hook.result.status === 'OPEN' || hook.result.status === 'TRADING'
              ? (hook.result.htlcStep < 3 ? 'PROGRESS' : 'DONE')
              : hook.result.status
            return {
              'PROGRESS': 'dealFlowMessageTitleOfferAccepted', // after htlc step 2
              'DONE': hook.result.type === 'BUY' ? 'dealFlowMessageTitleCollectPayment' : 'dealFlowMessageTitleCollectSecurities',  // after htlc step 3
              'CLOSED': 'dealFlowMessageTitleDealClosed', // after htlc step 4
              'CANCELLED': 'dealFlowMessageTitleOfferCancelled',
              'REJECTED': 'dealFlowMessageTitleOfferRejected' // not currently used but previously supported
            }[offerStatus]
          },
          htlcStep: 'result.htlcStep',
          quantity: 'result.quantity',
          unit: () => 'Shares',
          companyName: 'result.companyName',
          issuanceName: 'result.issuanceName'
        }
      })
    ),
    // SAFETY ZONE notification.  Notify the order creator of the safety zone.
    iff(
      hook => {
        return hook.result.timelock2ExpiredAt &&
                !hook.params.before.timelock2ExpiredAt &&
                hook.result.status !== 'CLOSED' &&
                (hook.result.status !== 'CANCELLED' || !hook.result.htlcTxId4)
      },
      hook => {
        return app.service('/orders').get({
          _id: hook.result.orderId
        }).then(result => {
          hook.params.order = result
          return hook
        })
      },
      createNotification({
        type: 'offer',
        addressPath: 'params.order.eqbAddress',
        fields: {
          offerId: 'result._id',
          orderId: 'result.orderId',
          type: 'result.type',
          assetType: 'result.assetType',
          status: hook => {
            if (hook.result.timelock2ExpiredAt && !hook.result.timelockExpiredAt) {
              return 'SAFETY_ZONE'
            } else {
              return 'EXPIRED'
            }
          },
          action: hook => {
            if (hook.result.timelock2ExpiredAt && !hook.result.timelockExpiredAt) {
              return 'dealFlowMessageTitleOfferSafetyZone'
            } else {
              return 'dealFlowMessageTitleOfferExpired'
            }
          },
          htlcStep: 'result.htlcStep',
          quantity: 'result.quantity',
          unit: 'Shares',
          companyName: 'result.companyName',
          issuanceName: 'result.issuanceName'
        }
      })
    ),
    // Full offer expiration.  Notify the offer creator
    iff(
      hook => {
        return hook.result.timelockExpiredAt &&
                !hook.params.before.timelockExpiredAt &&
                !hook.result.htlcTxId4 &&
                hook.result.status !== 'CLOSED'
      },
      createNotification({
        type: 'offer',
        addressPath: 'result.eqbAddress',
        fields: {
          offerId: 'result._id',
          orderId: 'result.orderId',
          type: 'result.type',
          assetType: 'result.assetType',
          status: hook => 'EXPIRED',
          action: hook => 'dealFlowMessageTitleOfferExpired',
          htlcStep: 'result.htlcStep',
          quantity: 'result.quantity',
          unit: 'Shares',
          companyName: 'result.companyName',
          issuanceName: 'result.issuanceName'
        }
      })
    )
  ]

  function removeOtherId (id, offer) {
    if (offer && offer.userId) {
      if (!offer.userId.equals(id)) {
        offer.userId = undefined
      }
    }
  }

  function orderOwnedByUser (userId, offerId) {
    const offersService = app.service('offers')
    return offersService.find({ query: { _id: offerId } })
      .then(response => {
        const ordersService = app.service('orders')
        return ordersService.find({ query: { _id: response.data[0].orderId } })
      })
      .then(response => response.data[0].userId && response.data[0].userId.equals(userId))
  }

  function offerOwnedByUser (userId, offerId) {
    const offersService = app.service('offers')
    return offersService.find({ query: { _id: offerId } })
      .then(response => response.data[0].userId && response.data[0].userId.equals(userId))
  }

  return {
    before: {
      all: [
        unless(hook => hook.method === 'find' || hook.method === 'get', authenticate('jwt'))
      ],
      find: [],
      get: [],
      create: [
        iff(
          isProvider('external'),
          keep(
            'orderId',
            'type',
            'assetType',
            'quantity',
            'btcAddress',
            'eqbAddress',
            'description',
            'timelock',
            'hashlock',
            'price'
          ),
          associateCurrentUser({ idField: '_id', as: 'userId' }),
          statusOnCreateIsOPEN(),
          // disabling this for now, backend cannot track or enforce this if trades happen outside of the system
          // must trust the utxo from the front end user.
          // iff(
          //   // if create data type is SELL
          //   context => {
          //     const { data } = context
          //     const type = data && data.type
          //     const assetType = data && data.assetType
          //
          //     return (type || '').toUpperCase() === 'SELL' && assetType === 'ISSUANCE'
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
              const type = data && data.type

              return (type || '').toUpperCase() === 'BUY'
            },
            context => {
              const { data } = context
              const ordersService = app.service('orders')
              return ordersService.find({ query: { _id: data.orderId } })
                .then(response => {
                  const order = response.data[0] || {}
                  const quantity = order.quantity || 0

                  if (data.quantity > quantity) {
                    return Promise.reject(new errors.BadRequest('Buy Quantity exceeds maximum'))
                  }
                  return Promise.resolve(context)
                })
            }
          ),
          discard(
            'timelockExpiredAt',
            'timelock2ExpiredAt',
            'timelockExpiresBlockheight',
            'timelock2ExpiresBlockheight'
          )
        )
      ],
      update: [
        mapUpdateToPatch()
      ],
      patch: [
        stashBefore(),
        iff(
          isProvider('external'),
          iff(
            hook => orderOwnedByUser(hook.params.user._id, hook.id),
            keep('isAccepted', 'htlcTxId2', 'htlcTxId4', 'htlcStep', 'before', 'status')
          ),
          iff(
            hook => offerOwnedByUser(hook.params.user._id, hook.id),
            keep('description', 'status', 'before', 'htlcStep', 'htlcTxId1', 'htlcTxId3')
          ),
          idRequired(),
          blockOfferAcceptance(app),
          discard(
            'timelockExpiredAt',
            'timelock2ExpiredAt',
            'timelockExpiresBlockheight',
            'timelock2ExpiresBlockheight'
          ),
          statusEnforcementOnChange(app)
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
      find: [
        iff(
          isProvider('external'),
          hook => hook.result.data.forEach(offer => {
            removeOtherId(hook.params.user ? hook.params.user._id : undefined, offer)
          })
        )
      ],
      get: [
        iff(
          isProvider('external'),
          hook => removeOtherId(hook.params.user ? hook.params.user._id : undefined, hook.result.data)
        )
      ],
      create: [
        updateTransaction({
          txIdPath: 'result.htlcTxId1',
          fieldsToUpdate: { offerId: 'result._id' }
        }),
        getEventAddress({
          from: 'data.btcAddress'
        }),
        getEventAddress({
          from: 'data.eqbAddress'
        }),
        hook => {
          return app.service('/orders').get({
            _id: hook.result.orderId
          }).then(result => {
            hook.params.order = result
            return hook
          })
        },
        createNotification({
          type: 'offer',
          addressPath: hook => {
            if (hook.result.type === 'BUY') {
              return hook.params.order.btcAddress
            } else {
              return hook.params.order.eqbAddress
            }
          },
          fields: {
            offerId: 'result._id',
            orderId: 'result.orderId',
            type: 'result.type',
            assetType: 'result.assetType',
            action: () => 'dealFlowMessageTitleOfferReceived',
            status: 'result.status',
            htlcStep: 'result.htlcStep',
            quantity: 'result.quantity',
            unit: 'Shares',
            price: 'result.price',
            companyName: 'result.companyName',
            issuanceName: 'result.issuanceName'
          }
        })
      ],
      update: [],
      patch: postUpdateHooks,
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
