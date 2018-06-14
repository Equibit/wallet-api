const errors = require('feathers-errors')

module.exports = function () {
  // attach details to an issuance based on the company id
  // errors if no company id is provided, or if the user does
  // not own the company
  return function associateCompany (context) {
    const { app, params, data } = context
    const service = app.service('companies')
    const userId = params.user && params.user._id
    const companyId = data.companyId
    const query = {
      userId,
      _id: companyId
    }
    return service.find({ query })
      .then(response => {
        const companies = response.data || response
        if (companies.length) {
          const company = companies[0]
          data.companyName = company.name
          data.companyIndex = company.index
          data.companySlug = company.slug
          data.domicile = company.domicile
          return context
        }
        return Promise.reject(new errors.BadRequest('Company does not exist or is not owned by user'))
      })
  }
}
