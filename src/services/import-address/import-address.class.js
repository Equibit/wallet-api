const errors = require('feathers-errors')

class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    return Promise.resolve({})
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    })
  }

  // params.data = { address: base58 addresses to import, type: "EQB"|"BTC", rescan: 1|0 }
  create (data, params) {
    const { address, type, rescan } = data
    const { app } = this.options

    return importAddressCore(app, type, address, rescan).catch(err => {
      const errRes = (err.response && err.response.data) || {
        message: err.message
      }
      console.log('_______ PROXY ERROR: ', errRes)
      throw new errors.GeneralError(errRes)
    })
  }

  update (id, data, params) {
    return Promise.resolve(data)
  }

  patch (id, data, params) {
    return Promise.resolve(data)
  }

  remove (id, params) {
    return Promise.resolve({ id })
  }
}

// http://localhost:3030/proxycore?node=btc&method=importaddress&params[]=mhKZ4UQh5dJQFZf3tUGX1j5QBKfjKK4ev6
const importAddressCore = function importAddressCore (app, type, address, rescan) {
  const proxycoreService = app.service('proxycore')

  const importPromise = proxycoreService.find({
    query: {
      node: type.toLowerCase(),
      method: 'importaddress',
      params: [address, '', !!rescan]
    }
  })

  return importPromise
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
