const errors = require('feathers-errors')

const queryOffers = function (app, orderIds) {
  const offersService = app.service('offers')
  const query = {
    $select: ['_id', 'quantity'],
    orderId: {
      $in: orderIds
    },
    status: {
      $in: ['CLOSED', 'TRADING']
    }
  }

  return offersService.find({ query })
}

const queryOrders = function (app, userId, assetType, issuanceId) {
  const ordersService = app.service('orders')

  const query = {
    $select: ['_id', 'quantity'],
    userId,
    type: 'SELL',
    status: {
      $in: ['OPEN', 'TRADING']
    },
    assetType
  }

  if (assetType === 'ISSUANCE') {
    query.issuanceId = issuanceId
  }

  return ordersService.find({ query })
}

const sellOrdersQuantityOpen = function (app, userId, assetType, issuanceId) {
  return queryOrders(app, userId, assetType, issuanceId)
    .then(ordersResponse => {
      const orders = ordersResponse.data || []
      const orderIds = []
      let sellOrdersQuantitySum = 0

      orders.forEach(order => {
        orderIds.push(order._id)
        sellOrdersQuantitySum += order.quantity
      })

      return queryOffers(app, orderIds)
        .then(offersResponse => {
          const offers = offersResponse.data || []
          let soldOffersQuantitySum = 0

          offers.forEach(offer => {
            soldOffersQuantitySum += offer.quantity
          })

          return {
            data: {
              sellOrdersQuantityOpen: sellOrdersQuantitySum - soldOffersQuantitySum
            }
          }
        })
    })
}

class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    const { app } = this.options
    // app.service('orders')
    const query = params.query || {}
    const user = params.user
    const userId = user && user._id.toString()
    const { assetType, issuanceId } = query

    if (assetType === 'ISSUANCE') {
      if (!issuanceId) {
        return Promise.reject(new errors.BadRequest('missing required param'))
      }
      return sellOrdersQuantityOpen(app, userId, assetType, issuanceId)
    } else if (assetType === 'EQUIBIT') {
      return sellOrdersQuantityOpen(app, userId, assetType)
    }

    return Promise.reject(new errors.BadRequest('unknown asset type'))
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    })
  }

  create (data, params) {
    return Promise.resolve(data)
  }

  update (id, data, params) {
    return Promise.resolve(data)
  }

  patch (id, data, params) {
    return Promise.resolve(data)
  }

  remove (id, params) {
    return Promise.resolve({ id })
  }
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
