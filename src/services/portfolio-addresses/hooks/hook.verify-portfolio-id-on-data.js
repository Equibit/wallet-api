const errors = require('feathers-errors')

// make sure create data has portfolioId specified that belongs to current user
module.exports = function () {
  return function verifyPortfolioIdOnData (context) {
    const { params, data } = context
    const { userPortfolios } = params
    const datas = Array.isArray(data) ? data : [data]

    datas.forEach(data => {
      if (data.portfolioId) {
        var found = false
        for (let i = 0; i < userPortfolios.length; i++) {
          if (userPortfolios[i]._id.toString() === data.portfolioId) {
            found = true
            break
          }
        }
        if (!found) {
          return Promise.reject(new errors.BadRequest('portfolioId not found'))
        }
      } else {
        return Promise.reject(new errors.BadRequest('portfolioId missing'))
      }
    })

    return Promise.resolve(context)
  }
}
