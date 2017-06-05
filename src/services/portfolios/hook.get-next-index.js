module.exports = function () {
  return function getNextIndex (context) {
    // Retrieve all of the user's existing portfolios by index.
    return context.service.find({ query: { $sort: { index: 1 } } })
      .then(response => {
        const portfolios = response.data || response
        const index = portfolios.reduce(function (acc, current) {
          return acc < current.index ? current.index : acc
        }, 0)
        context.data.index = index + 1
        return context
      })
  }
}
