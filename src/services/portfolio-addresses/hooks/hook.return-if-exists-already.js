// return existing record if create data is a duplicate
module.exports = function (app) {
  return function returnIfExistsAlready (context) {
    const { data } = context
    const portfolioAddressesService = app.service('portfolio-addresses')

    return portfolioAddressesService.find({
      query: {
        portfolioId: data.portfolioId,
        type: (data.type || '').toUpperCase(),
        index: ~~(data.index)
      }
    }).then(response => {
      const result = response.data[0]
      if (result) {
        context.result = Array.isArray(result) ? result[0] : result
      }
      return Promise.resolve(context)
    })
  }
}
