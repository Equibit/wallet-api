// if address didn't already exist, import it
module.exports = function (app) {
  return function importIfNew (context) {
    const { data, result } = context
    const { type, importAddress } = data

    // if hook returnIfExistsAlready set the result, then it's an old address, so no import
    // if the derived address was not provided, we can't import it so just continue as normal
    if (result || !importAddress) {
      return Promise.resolve(context)
    }

    const importAddressService = app.service('import-address')

    return importAddressService.create({
      type,
      address: importAddress,
      rescan: false
    }).then(response => {
      // continue on to create the portfolio address meta info
      return Promise.resolve(context)
    })
  }
}
