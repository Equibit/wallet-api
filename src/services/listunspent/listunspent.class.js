const axios = require('axios')
const errors = require('feathers-errors')
const {
  aggregateByAddress,
  addSummary,
  resultToSatoshi
} = require('./listunspent-utils')

// http://localhost:3030/proxycore?method=listunspent&params[0]=0&params[1]=99999&params[2][]=mp9GiieHrLQvLu4C8nE9bbwxNmXqcC3nVf&params[2][]=mwd7FgMkm9yfPmNTnntsRbugZS7BEZaf32

class Service {
  constructor (options) {
    this.options = options || {}
  }

  // Given a list of addresses return txouts and a summary OR amounts by address and a summary.
  find (params) {
    // console.log('listunspent.find params.query: ', params.query)
    const app = this.options.app
    const query = params.query
    const addressesBtc = query.btc || []
    const addressesEqb = query.eqb || []
    const byAddress = !!query.byaddress
    const doImport = !!query.doImport

    const configBtc = app.get('bitcoinCore')
    const configEqb = app.get('equibitCore')
    const importmultiService = app.service('importmulti')
    const importPromises = []

    if (doImport) {
      addressesBtc.length && importPromises.push(importmultiService.create({ addresses: addressesBtc, type: 'BTC' }))
      addressesEqb.length && importPromises.push(importmultiService.create({ addresses: addressesEqb, type: 'EQB' }))
    }
    console.log(importPromises.length, addressesBtc.length, addressesEqb.length)

    return Promise.all(importPromises).then(() => Promise.all([
      fetchListunspent(configBtc, addressesBtc),
      fetchListunspent(configEqb, addressesEqb)
    ]))
    .then(results => results.map(r => r.data.result))
    .then(results => results.map(resultToSatoshi))
    .then(results => {
      return {
        BTC: byAddress ? aggregateByAddress(results[0]) : addSummary(results[0]),
        EQB: byAddress ? aggregateByAddress(results[1]) : addSummary(results[1])
      }
    })
    .catch(err => {
      const errRes = (err.response && err.response.data) || {
        message: err.message
      }
      console.log('_______ PROXY ERROR: ', errRes)
      throw new errors.GeneralError(errRes)
    })
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    })
  }

  create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current)))
    }

    return Promise.resolve(data)
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

function fetchListunspent (config, addresses = []) {
  if (!addresses.length) {
    return Promise.resolve({data: {result: []}})
  }
  // console.log('fetchListunspent', arguments)

  return axios({
    method: 'POST',
    url: config.url,
    data: {
      jsonrpc: '1.0',
      method: (config.methodPrefix || '') + 'listunspent',
      params: [0, 99999, addresses]
    },
    auth: {
      username: config.username,
      password: config.password
    }
  }).then(a => {
    // console.log('[fetchListunspent] result:', a.data)
    return a
  })
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
