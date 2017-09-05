const formatTxnData = require('./hook.format-txn').formatTxnData

module.exports = function (options) {
  return function createReceiverTxn (context) {
    const { data, service } = context

    if (data.createReceiverTxn) {
      const typeMap = {
        OUT: 'IN',
        IN: 'OUT',
        BUY: 'SELL',
        SELL: 'BUY'
      }

      const txData = formatTxnData({
        address: data.otherAddress,
        otherAddress: data.address,
        type: typeMap[data.type],
        currencyType: data.currencyType,
        companyName: typeMap[data.companyName],
        companySlug: typeMap[data.companySlug],
        issuanceId: typeMap[data.issuanceId],
        issuanceName: typeMap[data.issuanceName],
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
