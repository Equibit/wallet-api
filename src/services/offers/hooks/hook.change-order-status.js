module.exports = function () {
  return function changeOrderStatus (context) {
    const { app, result } = context
    const ordersService = app.service('/orders')
    return ordersService.get({
      _id: result.orderId
    })
      .then(order => {
        // If fill or kill order is cancelled or refunded (status is set to CANCELLED), set order to OPEN
        if (order.isFillOrKill && (result.status === 'CANCELLED' || result.timelockExpiredAt)) {
          return ordersService.patch(result.orderId, {
            status: 'OPEN'
          }).then(() => context)
        }

        if (result.htlcStep === 4) {
          if (order.isFillOrKill) {
            return ordersService.patch(result.orderId, {
              status: 'CLOSED'
            }).then(() => context)
          }
          // Only close when order is fully filled
          return context.service.find({query: {orderId: result.orderId, isAccepted: true}})
            .then(res => {
              const totalQuantity = res.data.reduce((total, curr) => total + curr.quantity, 0)
              if (totalQuantity >= order.quantity) {
                return ordersService.patch(result.orderId, {
                  status: 'CLOSED'
                }).then(() => context)
              }
              return context
            })
        }

        if (result.isAccepted && result.htlcStep === 2) {
          return ordersService.patch(result.orderId, {
            status: 'TRADING'
          }).then(() => context)
        }

        return context
      })
  }
}
