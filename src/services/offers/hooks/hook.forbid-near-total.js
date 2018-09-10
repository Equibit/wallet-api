// throw an error if a transaction would leave an order so nearly empty that it would be impossible to fulfill
module.exports = function () {
  return function forbid (context) {
    const { data } = context
    const BCService = context.app.service('blockchain-info')
    const orderService = context.app.service('orders')
    const checkEqb = data.assetType !== 'ISSUANCE'
    const eqbAmtSat = data.quantity
    // price is in BTC satoshi per full EQB, so we have to convert
    const btcAmtSat = (eqbAmtSat / 100000000) * data.price
    return Promise.all([
      BCService.find({query: {}}),
      orderService.get(data.orderId),
      context.service.find({query: {orderId: data.orderId, isAccepted: true}})
    ])
    .then(([chainInfo, order, acceptedOffers]) => {
      const eqbInfo = chainInfo.data.find(info => info.coinType === 'EQB')
      const eqbRelay = eqbInfo ? eqbInfo.relayfee : 0.00001
      const btcInfo = chainInfo.data.find(info => info.coinType === 'BTC')
      const btcRelay = eqbInfo ? btcInfo.relayfee : 0.00001

      let orderEqbSatRemaining = order.quantity
      let orderBtcSatRemaining = (orderEqbSatRemaining / 100000000) * order.price
      acceptedOffers.data.forEach(offer => {
        orderEqbSatRemaining -= offer.quantity
        orderBtcSatRemaining -= ((offer.quantity / 100000000) * offer.price)
      })
      orderEqbSatRemaining -= eqbAmtSat
      orderBtcSatRemaining -= btcAmtSat
      if (checkEqb && orderEqbSatRemaining && orderEqbSatRemaining <= (eqbRelay * 100000000)) {
        return Promise.reject(new Error(`remaining EQB - ${orderEqbSatRemaining} - would be too low (min relay fee not met)`))
      }
      // this is not an error - we check if the order would be completed by checking how
      // many equibits are sold. Small floating point errors could cause the btc amount to be non-zero
      if (orderEqbSatRemaining && orderBtcSatRemaining <= (btcRelay * 100000000)) {
        return Promise.reject(new Error(`remaining BTC - ${orderBtcSatRemaining} - would be too low (min relay fee not met)`))
      }
    })
  }
}
