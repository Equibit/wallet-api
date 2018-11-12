const errors = require('feathers-errors')

// Only allow cancelling of an order under certain conditions
module.exports = function (app) {
  return function allowCancel (context) {
    const { data, params } = context
    const newStatus = data.status || ''

    // used stashBefore earlier in hooks to get current order
    // https://feathers-plus.github.io/v1/feathers-hooks-common/#stashbefore
    const order = params.before || {}
    const currentStatus = order.status || ''

    if (newStatus.toUpperCase() === 'CANCELLED' && currentStatus.toUpperCase() !== 'CANCELLED') {
      // This patch/update is cancelling the order
      if (order.status !== 'OPEN') {
        return Promise.reject(new errors.BadRequest('Order cannot be cancelled unless it is open.'))
      }

      return app.service('offers')
        .find({ query: { orderId: order._id, isAccepted: true } })
        .then(response => {
          const acceptedOffers = response.data || []
          const hasAcceptedAny = !!(acceptedOffers.length)
          if (hasAcceptedAny) {
            return Promise.reject(new errors.BadRequest('Order cannot be cancelled after an offer has been accepted.'))
          }
          return Promise.resolve(context)
        })
    }

    return Promise.resolve(context)
  }
}
