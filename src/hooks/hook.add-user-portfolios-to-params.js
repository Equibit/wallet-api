// decorate params with portfolios the user owns in 'userPortfolios' property for validations
// assumes params.user exists/is authenticated
module.exports = function (app) {
  return function addUserPortfoliosToParams (context) {
    const { params } = context
    const { user } = params
    const portfoliosService = app.service('portfolios')
    return portfoliosService.find({ query: { userId: user._id } })
      .then(response => {
        params.userPortfolios = response.data
        return Promise.resolve(context)
      })
  }
}
