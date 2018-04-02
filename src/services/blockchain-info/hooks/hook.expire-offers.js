module.exports = function () {
  return hook => {
    let blockHeight = hook.result.currentBlockHeight
    if (blockHeight > hook.params.before.currentBlockHeight) {
      const blockHeights = []
      do {
        blockHeights.push(blockHeight)
        blockHeight--
      } while (blockHeight > hook.params.before.currentBlockHeight)

      // SELL order / BUY offer
      // HTLC1 expirarion (full exp) is BTC/payment
      // HTLC2 expiration (partial exp) is EQB/securities
      //
      // BUY order / SELL offer
      // HTLC1 expirarion (full exp) is EQB/securities
      // HTLC2 expiration (partial exp) is BTC/payment
      //
      const isEqb = hook.result.coinType === 'EQB'
      const service = hook.app.service('/offers')

      service.find({
        query: {
          type: isEqb ? 'BUY' : 'SELL',
          timelock2ExpiresBlockheight: { $in: blockHeights }
        }
      }).then(result => {
        return Promise.all(
          result.data.map(offer =>
            service.patch(
              offer._id,
              {
                timelock2ExpiredAt: Date.now()
              })
            )
        )
      }).catch(console.error.bind(console))

      service.find({
        query: {
          type: isEqb ? 'SELL' : 'BUY',
          timelockExpiresBlockheight: { $in: blockHeights }
        }
      }).then(result => {
        return Promise.all(
          result.data.map(offer =>
            service.patch(
              offer._id,
              {
                timelockExpiredAt: Date.now()
              })
            )
        )
      }).catch(console.error.bind(console))

      return hook
    }
  }
}
