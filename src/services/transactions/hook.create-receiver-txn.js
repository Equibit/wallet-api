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

    console.log(`hook.create-receiver-txn: (createReceiverTxn=${data.createReceiverTxn})  type=${data.type}, fromAddress=(${data.fromAddress})}, toAddress=(${data.toAddress})}`)
    if (data.createReceiverTxn && typeMap[data.type]) {
      const txData = formatTxnData({
        address: data.toAddress,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        type: typeMap[data.type],
        currencyType: data.currencyType,
        companyName: data.companyName,
        companySlug: data.companySlug,
        issuanceId: data.issuanceId,
        issuanceName: data.issuanceName,
        issuanceType: data.issuanceType,
        issuanceUnit: data.issuanceUnit,
        txId: data.txId,
        amount: data.amount,
        fee: data.fee,
        htlcStep: data.htlcStep,
        hashlock: data.hashlock,
        timelock: data.timelock,
      })
      console.log(`hook.create-receiver-txn: -> ${txData.type} (${txData.address})`, txData)

      return service.create(txData).then(response => {
        return context
      })
    } else {
      return Promise.resolve(context)
    }
  }
}
