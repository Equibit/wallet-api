// const errors = require('feathers-errors')

module.exports = function () {
  // assign a index to a record. The index is unique among records
  // associated with the user
  return function assignIndex (context) {
    const { service, params, data } = context
    const userId = params.user && params.user._id
    const query = {
      userId,
      $sort: { index: -1 },
      $limit: 1
    }
    // Retrieve all records associated with the current user
    return service.find({ query })
      .then(response => {
        const records = response.data || response
        let highestIndex = -1

        if (records.length) {
          // Find the highest index
          highestIndex = records[0].index
        }

        data.index = highestIndex + 1
        return context
      })
  }
}
