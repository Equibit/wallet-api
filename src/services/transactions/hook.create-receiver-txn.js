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

    if (data.createReceiverTxn && typeMap[data.type]) {
      const txData = formatTxnData({
        address: data.otherAddress,
        otherAddress: data.address,
        type: typeMap[data.type],
        currencyType: data.currencyType,
        companyName: data.companyName,
        companySlug: data.companySlug,
        issuanceId: data.issuanceId,
        issuanceName: data.issuanceName,
        issuanceType: data.issuanceType,
        issuanceUnit: data.issuanceUnit,
        txIdBtc: data.txIdBtc,
        txIdEqb: data.txIdEqb,
        amount: data.amount,
        fee: data.fee
      })

      return service.create(txData).then(response => {
        return context
      })
    } else {
      return Promise.resolve(context)
    }
  }
}
