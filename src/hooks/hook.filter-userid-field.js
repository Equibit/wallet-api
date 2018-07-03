const errors = require('feathers-errors')
const { discard } = require('feathers-hooks-common')

module.exports = function () {
  return function filterUserIdField (context) {
    if (context.params.authenticated) {
      const { result, params, method } = context
      if (method === 'find') {
        result.data.forEach(order => {
          if (order.userId.toString() !== params.user._id.toString()) order.userId = undefined
        })
      } else if (method === 'get') {
        if (result.userId.toString() !== params.user._id.toString()) context.result.userId = undefined
      } else {
        return Promise.reject(new errors.BadRequest('Only find or get methods allowed!'))
      }
    } else {
      context = discard('userId')(context)
    }

    return Promise.resolve(context)
  }
}
