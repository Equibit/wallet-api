// throw an error if a transaction would require a payment too small to process
module.exports = function () {
  return function allowCancel (context) {
    const { data } = context
    const BCService = context.app.service('blockchain-info')
    const checkEqb = data.assetType !== 'ISSUANCE'
    const eqbAmtSat = data.quantity
    // price is in BTC satoshi per full EQB, so we have to convert
    const btcAmtSat = (eqbAmtSat / 100000000) * data.price
    return BCService.find({query: {}}).then(result => {
      const eqbInfo = result.data.find(info => info.coinType === 'EQB')
      const eqbRelay = eqbInfo ? eqbInfo.relayfee : 0.00001
      const btcInfo = result.data.find(info => info.coinType === 'BTC')
      const btcRelay = eqbInfo ? btcInfo.relayfee : 0.00001
      if (checkEqb && eqbAmtSat <= (eqbRelay * 100000000)) {
        return Promise.reject(new Error(`EQB quantity - ${eqbAmtSat} - too low (min relay fee not met)`))
      }
      if (btcAmtSat <= (btcRelay * 100000000)) {
        return Promise.reject(new Error(`BTC quantity - ${btcAmtSat} - too low (min relay fee not met)`))
      }
    })
  }
}
