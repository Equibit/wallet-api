module.exports = function () {
  return function addBalanceHook (context) {
    const address = context.data.address

    return context.app.service('balances').get(address)
      .then(response => {
        context.data.balance = 0
        return context
      })
  }
}
