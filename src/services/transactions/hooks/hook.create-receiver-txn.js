const formatTxnData = require('./hook.format-txn').formatTxnData

module.exports = function (options) {
  return function createReceiverTxn (context) {
    const { data, service } = context

    const typeMap = {
      OUT: 'IN',
      // IN: 'OUT', // we should not create a receiver tx for type IN which cannot be the main tx.
      BUY: 'SELL',
      SELL: 'BUY'
    }

    // console.log(`hook.create-receiver-txn: (createReceiverTxn=${data.createReceiverTxn})  type=${data.type}, fromAddress=(${data.fromAddress})}, toAddress=(${data.toAddress})}`)
    if (data.createReceiverTxn && typeMap[data.type]) {
      const txData = formatTxnData({
        address: data.address === data.toAddress ? data.fromAddress : data.toAddress,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        type: typeMap[data.type],
        assetType: data.assetType,
        currencyType: data.currencyType,
        companyName: data.companyName,
        companySlug: data.companySlug,
        issuanceId: data.issuanceId,
        issuanceName: data.issuanceName,
        issuanceType: data.issuanceType,
        issuanceUnit: data.issuanceUnit,
        txId: data.txId,
        amount: data.amount,
        // Note: no fee should be shown because its paid by another party.
        htlcStep: data.htlcStep,
        hashlock: data.hashlock,
        timelock: data.timelock,
        offerId: data.offerId,
        costPerShare: data.costPerShare
      })
      // console.log(`hook.create-receiver-txn: -> ${txData.type} (${txData.address})`, txData)

      return service.create(txData).then(response => {
        context.receiverTxn = response
        return context
      })
    } else {
      return Promise.resolve(context)
    }
  }
}
