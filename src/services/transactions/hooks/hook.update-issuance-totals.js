
module.exports = function (options) {
  return context => {
    // Patch any related issuance if type is CANCEL to decrease the 'sharesIssued' number
    const transaction = context.result || {}
    const { type, issuanceId, amount, htlcStep } = transaction
    const issuancesService = context.app.service('issuances')
    // if cancelling an issuance (blanking the eqb), then the shares authorized should be decreased by amount
    if (issuanceId && amount) {
      return issuancesService.get(issuanceId).then(issuance => {
        if (type === 'CANCEL') {
          // $inc increases the value that's on the record atomicly (so don't need to worry about other changes at the same time)
          // patching { sharesIssued: issuance.sharesIssued - amount } is dangerous if issuance changed between a fetch and the patch
          // https://docs.mongodb.com/manual/reference/operator/update/inc/ (inc by negative is a decrease)
          //
          // shares held at the issuance address are not "issued", so only decrement sharesIssued if cancelled
          // from a different address.
          const fromSharesIssued = issuance.issuanceAddress === transaction.fromAddress ? 0 : amount
          return issuancesService.patch(issuanceId, { $inc: { sharesAuthorized: -amount, sharesIssued: -fromSharesIssued } })
            .then(() => Promise.resolve(context))
        // Be careful not to double-count TRADE transactions to or from the issuance address.
        // To avoid the double count, increment only when the user collects the securities (in step 3 or 4)
        // REFUND transactions will not need to change the count (since they take the place of htlc3/4 TRADEs)
        } else if (type === 'TRANSFER' || (type === 'TRADE' && htlcStep >= 3)) {
          if (issuance.issuanceAddress === transaction.toAddress) {
            return issuancesService.patch(issuanceId, { $inc: { sharesIssued: -amount } })
          }
          if (issuance.issuanceAddress === transaction.fromAddress) {
            return issuancesService.patch(issuanceId, { $inc: { sharesIssued: amount } })
          }
        }
      }).then(patchResponse => Promise.resolve(context))
    }

    return Promise.resolve(context)
  }
}
