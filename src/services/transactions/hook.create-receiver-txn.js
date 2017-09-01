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

      return service.create({
        address: data.otherAddress,
        otherAddress: data.address,
        type: typeMap[data.type],
        currencyType: data.currencyType,
        txIdBtc: data.txIdBtc,
        txIdEqb: data.txIdEqb,
        amount: data.amount,
        fee: data.fee
      }).then(response => {
        return context
      })
    } else {
      return Promise.resolve(context)
    }
  }
}
