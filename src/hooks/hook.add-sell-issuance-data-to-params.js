// decorate params with sellIssuanceData from the issuance specified by data.issuanceId
// assumes params.user exists/is authenticated

const sum = function (list, prop) {
  return list.reduce((total, obj) => total + (obj[prop] || 0), 0)
}

/**
 * params.sellIssuanceData will be an object containing:
 * `issuance` issuance from data.issuanceId
 * `sellOrderTotal` sum of `SELL` Order.quantity where Issuance and User match and not expired and Order.status $in: ['OPEN', 'TRADING']
 * `sellOfferTotal` sum of `SELL` Offer.quantity where Issuance and User match and not expired and Offer.status $in: ['OPEN', 'TRADING']
 * `maxSellQuantity` = issuance.sharesAuthorized - issuance.sharesIssued - sellOrderTotal - sellOfferTotal
 * (NOTE: issuance.sharesAuthorized - issuance.sharesIssued should be equal to issuance.utxoAmountTotal on the front end)
 */
module.exports = function (app) {
  return function addSellIssuanceDataToParams (context) {
    const { params, data } = context
    const { user } = params
    const ordersService = app.service('orders')
    const offersService = app.service('offers')
    const issuancesService = app.service('issuances')

    // query for offers and/or orders
    const query = {
      userId: user._id,
      issuanceId: data.issuanceId,
      type: 'SELL',
      // TODO: not expired
      status: { $in: ['OPEN', 'TRADING'] }
    }

    const issuanceQuery = {
      _id: data.issuanceId
    }

    const promises = Promise.all([
      ordersService.find({ query }),
      offersService.find({ query }),
      issuancesService.find({ query: issuanceQuery })
    ])

    return promises.then(response => {
      const sellIssuanceData = {}
      sellIssuanceData.sellOrderTotal = sum(response[0].data, 'quantity')
      sellIssuanceData.sellOfferTotal = sum(response[1].data, 'quantity')
      const issuance = response[2].data[0] || {}
      const sharesAuthorized = issuance.sharesAuthorized || 0
      const sharesIssued = issuance.sharesIssued || 0
      sellIssuanceData.issuance = issuance
      sellIssuanceData.maxSellQuantity = sharesAuthorized - sharesIssued - sellIssuanceData.sellOrderTotal - sellIssuanceData.sellOfferTotal
      params.sellIssuanceData = sellIssuanceData
      return Promise.resolve(context)
    })
  }
}
