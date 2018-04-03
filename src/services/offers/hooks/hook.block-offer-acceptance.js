const errors = require('feathers-errors')

/*
# Blocking BUY Offer acceptance (PATCH) (offer.isAccepted set to true) based on Quantities
  Buy Offer -> isAccepted = true
    * `buyOfferTotal =` sum of `BUY` Offer.quantity where
      - orderId is the same as current one
      - AND not expired
      - AND have .status $in: ['TRADING', 'CLOSED']
    * block if `this BUY Offer.quantity > SELL Order.quantity - buyOfferTotal`
*/

module.exports = function (app) {
  return function blockOfferAcceptance (context) {
    const { data, id, params } = context
    const query = params.query || {}
    const offerId = id || query._id
    const offersService = app.service('offers')

    // if we're not setting isAccepted to true in this patch, continue normally
    if (!data.isAccepted) {
      return Promise.resolve(context)
    }

    return offersService.find({ query: { _id: offerId } })
      .then(response => {
        const currentOffer = response.data[0]

        // if we're setting isAccepted to true but it's already true, continue normally
        if (currentOffer.isAccepted) {
          return Promise.resolve(context)
        }
        // else isAccepted is becoming set to true (this is the patch that accepts the buy offer)

        // query for other BUY offers on this sell order that are trading or closed
        const query = {
          type: 'BUY',
          orderId: currentOffer.orderId,
          status: {
            $in: ['TRADING', 'CLOSED']
          }
        }

        return offersService.find({ query })
          .then(offersResponse => {
            // todo: skip adding ones that are expired if status is TRADING
            const buyOfferTotal = offersResponse.data.reduce((total, obj) => total + (obj.quantity || 0), 0)
            const ordersService = app.service('orders')

            return ordersService.find({ query: { _id: currentOffer.orderId } })
              .then(orderResponse => {
                const order = orderResponse.data[0]
                const offerQuantity = data.quantity || currentOffer.quantity || 0
                const maxOfferQuantity = order.quantity - buyOfferTotal

                if (offerQuantity > maxOfferQuantity) {
                  return Promise.reject(new errors.BadRequest('Offer quantity exceeds maximum available.'))
                }
                return Promise.resolve(context)
              })
          })
      })
  }
}
