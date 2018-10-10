module.exports = function () {
  return function changeOrderStatus (context) {
    const { app, result } = context
    const ordersService = app.service('/orders')
    const getTotalQuantity = () =>
      context.service.find({query: {orderId: result.orderId, isAccepted: true}})
      .then(res => res.data.reduce((total, curr) => total + curr.quantity, 0))
    const patchOrders = (status) =>
      ordersService.patch(result.orderId, { status }).then(() => context)

    return ordersService.get({
      _id: result.orderId
    })
      .then(order => {
        // If fill or kill order is cancelled or refunded (status is set to CANCELLED), set order to OPEN
        if (order.isFillOrKill && (result.status === 'CANCELLED' || result.timelockExpiredAt)) {
          return patchOrders('OPEN')
        }

        if (result.htlcStep === 4) {
          if (order.isFillOrKill) {
            return patchOrders('CLOSED')
          }
          // Only close when order is fully filled
          return getTotalQuantity()
            .then(totalQuantity => {
              if (totalQuantity >= order.quantity) {
                return patchOrders('CLOSED')
              }
              return context
            })
        }

        if (result.isAccepted && result.htlcStep === 2) {
          if (order.isFillOrKill) {
            return patchOrders('TRADING')
          } else {
            return getTotalQuantity()
              .then(totalQuantity => patchOrders(totalQuantity >= order.quantity ? 'TRADING' : 'TRADING-AVAILABLE'))
          }
        }

        return context
      })
  }
}
