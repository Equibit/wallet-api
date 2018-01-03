const errors = require('feathers-errors')

// only execute on external calls, verifies specified id belongs to the logged in user
module.exports = function (app) {
  return function verifyIdBelongsToUser (context) {
    const { id, params } = context
    const { userPortfolios } = params
    const portfolioAddressesService = app.service('portfolio-addresses')
    return portfolioAddressesService.find({ query: { _id: id } })
      .then(response => {
        const portfolioAddress = response.data[0]
        if (portfolioAddress) {
          var found = false
          for (let i = 0; i < userPortfolios.length; i++) {
            if (userPortfolios[i]._id.toString() === portfolioAddress.portfolioId.toString()) {
              found = true
              break
            }
          }
          if (!found) {
            return Promise.reject(new errors.BadRequest('portfolioId not found'))
          }
        }
        return Promise.resolve(context)
      })
  }
}
