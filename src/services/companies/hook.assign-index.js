const errors = require('feathers-errors')

module.exports = function () {
  return function assignIndex (context) {
    const { service, params, data } = context
    const userId = params.user && params.user._id
    const query = {
      userId,
      $sort: { index: -1 },
      $limit: 1
    }
    // Retrieve all companies for the current user
    return service.find({ query })
      .then(response => {
        const companies = response.data || response
        let highestIndex = -1

        if (companies.length) {
          // Find the highest index
          highestIndex = companies[0].index
        }

        data.index = highestIndex + 1
        return context
      })
  }
}
