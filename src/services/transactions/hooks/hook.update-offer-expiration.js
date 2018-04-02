/**
 * Hook updates Offer `timelock1ExpiresBlockheight` or `timelock1ExpiresBlockheight` if the patched transaction
 * is either htlc1 or htlc2 of the offer, and if transaction `confirmationBlockHeight` is set.
 */

module.exports = function (options) {
  return function updateOfferExpiration (hook) {
    const tx = hook.result
    if ([1, 2].indexOf(tx.htlcStep) === -1 || !tx.confirmationBlockHeight) {
      return hook
    }

    // console.log('hook', hook)
    const txId = tx.txId
    const htlcStep = tx.htlcStep
    const htlcField = `htlcTxId${htlcStep}`
    const timelockField = htlcStep === 1 ? 'timelock' : 'timelock2'
    const timelockExpiryField = `timelock${htlcStep}ExpiresBlockheight`

    const offerService = hook.app.service('/offers')

    return offerService.find({query: {[htlcField]: txId}}).then(results => {
      results = results.data || results
      const offer = results[0]
      // console.log(`offerService`, offer)
      if (offer) {
        const expiryBlockheight = offer[timelockField] + tx.confirmationBlockHeight
        return offerService.patch(offer._id, {[timelockExpiryField]: expiryBlockheight})
          .then(() => hook)
      } else {
        return hook
      }
    })
  }
}
