// Need to determine if the stock has moved from issuer to buyer, and if so, update issuance.sharesIssued
// in buy offer flow, we need to know if the issuer is the one who placed the sell order associated to the offer
const buyOfferFlow = function (app, context, offer, issuance) {
  const issuancesService = app.service('issuances')
  const ordersService = app.service('orders')
  const orderId = offer.orderId.toString()
  const quantity = offer.quantity || 0

  return ordersService.find({ query: { _id: orderId } })
    .then(findResponse => {
      const order = findResponse.data[0] || { userId: '' }
      const orderUserIsIssuer = order.userId.toString() === issuance.userId.toString()
      // console.log('######OFFER BUY - STOCK IS FROM ISSUER########', orderUserIsIssuer)

      // update the issuance.sharesIssued property with the new quantity offered
      if (orderUserIsIssuer) {
        // $inc increases the value that's on the record atomicly (so don't need to worry about other changes at the same time)
        // patching { sharesIssued: issuance.sharesIssued + quantity } is dangerous if issuance changed between fetch and patch
        // https://docs.mongodb.com/manual/reference/operator/update/inc/
        return issuancesService.patch(offer.issuanceId, { $inc: { sharesIssued: quantity } })
          .then(patchResponse => Promise.resolve(context))
      }
      // if it's not the issuer (secondary market), then it isn't new shares so nothing to update

      return Promise.resolve(context)
    })
}

// Need to determine if the stock has moved from issuer to buyer, and if so, update issuance.sharesIssued
// in sell offer flow, we need to know if the issuer is the one who is selling the stock
const sellOfferFlow = function (app, context, offer, issuance) {
  const issuancesService = app.service('issuances')
  const quantity = offer.quantity || 0
  const offerUserIsIssuer = offer.userId.toString() === issuance.userId.toString()
  // console.log('######OFFER SELL - STOCK IS FROM ISSUER########', offerUserIsIssuer)

  // update the issuance.sharesIssued property with the new quantity offered by the issuer
  if (offerUserIsIssuer) {
    // $inc increases the value that's on the record atomicly (so don't need to worry about other changes at the same time)
    // patching { sharesIssued: issuance.sharesIssued + quantity } is dangerous if issuance changed between fetch and patch
    // https://docs.mongodb.com/manual/reference/operator/update/inc/
    return issuancesService.patch(offer.issuanceId, { $inc: { sharesIssued: quantity } })
      .then(patchResponse => Promise.resolve(context))
  }
  // if it's not the issuer (secondary market), then it isn't new shares so nothing to update

  return Promise.resolve(context)
}

// After an offer closes, if the issuer is the one moving stocks, update issuance.sharesIssued by adding the new offer.quantity
module.exports = function (app) {
  return function patchSharesIssuedAfterClosed (context) {
    const data = context.data || {}
    const offer = context.result
    const isBuyOffer = offer.type === 'BUY'

    // if offer is now closed and this was the patch/update that closed it
    if (offer.status === 'CLOSED' && data.htlcStep >= 4) {
      // look up the issuance
      return app.service('issuances').find({ query: { _id: offer.issuanceId } })
        .then(response => {
          const issuance = response.data[0] || { userId: '' }
          const flowFn = isBuyOffer ? buyOfferFlow : sellOfferFlow
          return flowFn(app, context, offer, issuance)
        })
    }
    return Promise.resolve(context)
  }
}
