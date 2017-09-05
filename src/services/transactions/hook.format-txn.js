function formatTxnData (data) {
  data.type = data.type.toUpperCase()
  data.currencyType = data.currencyType.toUpperCase()
  data.issuanceType = data.issuanceId
    ? ('')
    : (data.currencyType === 'BTC' && 'Bitcoin' || data.currencyType === 'EQB' && 'Equibit')
  return data
}

module.exports = function (options) {
  return function formatTxn (context) {
    Promise.resolve(formatTxnData(context.data))
  }
}
module.exports.formatTxnData = formatTxnData
