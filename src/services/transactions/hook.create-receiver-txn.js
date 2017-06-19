module.exports = function (options) {
  return function createReceiverTxn (context) {
    Promise.resolve(context)
  }
}
