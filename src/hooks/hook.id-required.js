const errors = require('feathers-errors')

module.exports = function () {
  // helps avoid accidnetal data wipes: if id is not present on hook context and _id is not in params query, request fails
  return function idRequired (context) {
    const { id, params } = context
    const query = params.query || {}

    if (id || query._id) {
      return Promise.resolve(context)
    }

    return Promise.reject(new errors.BadRequest('id must be specified'))
  }
}
