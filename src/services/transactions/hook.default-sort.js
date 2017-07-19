module.exports = function () {
  return function requireAddresses (context) {
    if (!context.params.query['$sort']) {
      context.params.query['$sort'] = {createdAt: -1}
    }
    return Promise.resolve(context)
  }
}
