module.exports = function (options) {
  return function validateRawTxn (context) {
    context.data.type = context.data.type.toUpperCase()
    context.data.currencyType = context.data.currencyType.toUpperCase()
    Promise.resolve(context)
  }
}
