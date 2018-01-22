// restrict query to portfolioIds owned by params.user
module.exports = function () {
  return function restrictQueryToUserPortfolio (context) {
    const { params } = context
    const { userPortfolios } = params

    if (!params.query) {
      params.query = {}
    }

    if (typeof params.query.portfolioId === 'string') {
      var found = false
      for (let i = 0; i < userPortfolios.length; i++) {
        if (userPortfolios[i]._id.toString() === params.query.portfolioId) {
          found = true
          break
        }
      }
      if (!found) {
        // no portfolio addresses will be returned if user doesn't own the one specified
        params.query.portfolioId = '-1'
      }
    } else {
      // if portfolioId not specified, limit to ones owned by user
      params.query.portfolioId = {
        $in: userPortfolios.map(portfolio => portfolio._id)
      }
    }
  }
}
