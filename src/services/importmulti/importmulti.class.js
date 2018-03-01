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

  // params.data = { addresses: [array of base58 addresses to import], type: "EQB"|"BTC" }
  create (data, params) {
    const { addresses, type, importFrom } = data
    const { app } = this.options
    const { userPortfolios } = params
    const portfolio = (userPortfolios && userPortfolios[0]) || {}
    const useImportFrom = importFrom || portfolio.importFrom || portfolio.createdAt

    return importAddressesCore(app, type, addresses, useImportFrom).catch(err => {
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

// http://localhost:3030/proxycore?node=eqb&method=importmulti&params[0][0][scriptPubKey][address]=mvuf7FVBox77vNEYxxNUvvKsrm2Mq5BtZZ&params[0][0][watchonly]=true&params[0][0][timestamp]=now
/*
  [
    [
      {
        "scriptPubKey": {
          "address": "mvuf7FVBox77vNEYxxNUvvKsrm2Mq5BtZZ"
        },
        "watchonly": true,
        "timestamp": "now"
      }
    ]
  ]
*/
const importAddressesCore = function importAddressesCore (app, type, addresses, importFrom) {
  const proxycoreService = app.service('proxycore')
  const timestamp = new Date(importFrom).getTime() || 'now'
  const param = addresses.map(address => {
    if (typeof address !== 'string') {
      address = ''
    }
    return { scriptPubKey: { address }, timestamp, watchonly: true }
  })

  const importPromise = proxycoreService.find({
    query: {
      node: type.toLowerCase(),
      method: 'importmulti',
      params: [param]
    }
  })

  return importPromise
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
