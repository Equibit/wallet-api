// for the issuance patches, we use $inc
// $inc increases the value that's on the record atomicly (so don't need to worry about other changes at the same time)
// patching { sharesIssued: issuance.sharesIssued + quantity } is dangerous if issuance changed between fetch and patch
// https://docs.mongodb.com/manual/reference/operator/update/inc/

const offerFlowClosedUpdateSharesIssued = function (offer, issuancesService, ordersService) {
  const isBuyOffer = offer.type === 'BUY'
  const offerQuantity = offer.quantity || 0

  return issuancesService.find({ query: { _id: offer.issuanceId } })
    .then(response => {
      const issuance = response.data[0] || { userId: '' }
      const offerUserIsIssuer = offer.userId.toString() === issuance.userId.toString()

      if (offerUserIsIssuer) {
        // in the buy offer flow, if issuer placed the buy offer, the shares are returning to the pool and should be subtracted
        // in the sell offer flow, if the issuer placed the sell offer, the sharesIssued increases
        const quantity = isBuyOffer ? -offerQuantity : offerQuantity
        // console.log("KSJDFKSDKFJSDF", "buy offer:", isBuyOffer, "offer user is issuer")
        return issuancesService.patch(offer.issuanceId, { $inc: { sharesIssued: quantity } })
      }

      return ordersService.find({ query: { _id: offer.orderId.toString() } })
        .then(findResponse => {
          const order = findResponse.data[0] || { userId: '' }
          const orderUserIsIssuer = order.userId.toString() === issuance.userId.toString()

          if (orderUserIsIssuer) {
            // in the buy offer flow, if offerUserIs NOT Issuer, but the sell orderUserIsIssuer, then shares are being issued
            // in the sell offer flow, if offerUserIs NOT Issuer, but the buy orderUserIsIssuer, then issuer is buying back and sharesIssued decreases
            const quantity = isBuyOffer ? offerQuantity : -offerQuantity
            // console.log("KSJDFKSDKFJSDF", "buy offer:", isBuyOffer, "order user is issuer")
            return issuancesService.patch(offer.issuanceId, { $inc: { sharesIssued: quantity } })
          }

          // purely secondary market, issuer not involved
          return Promise.resolve('nothing to update')
        })
    })
}

// After an offer closes, if the issuer is the one moving stocks, update issuance.sharesIssued by adding the new offer.quantity
module.exports = function (app) {
  return function patchSharesIssuedAfterClosed (context) {
    const data = context.data || {}
    const offer = context.result

    // if offer is now closed and this was the patch/update that closed it
    if (offer.status === 'CLOSED' && data.htlcStep >= 4) {
      return offerFlowClosedUpdateSharesIssued(offer, app.service('issuances'), app.service('orders'))
        .then(x => Promise.resolve(context))
    }

    return Promise.resolve(context)
  }
}
