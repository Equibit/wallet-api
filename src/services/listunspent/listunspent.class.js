const axios = require('axios')
const errors = require('feathers-errors')
const {
  aggregateByAddress,
  addSummary,
  resultToSatoshi
} = require('./listunspent-utils')

const { timeout } = require('../../utils/timeout-promise')

// http://localhost:3030/proxycore?method=listunspent&params[0]=0&params[1]=99999&params[2][]=mp9GiieHrLQvLu4C8nE9bbwxNmXqcC3nVf&params[2][]=mwd7FgMkm9yfPmNTnntsRbugZS7BEZaf32

class Service {
  constructor (options) {
    this.options = options || {}
  }

  // Given a list of addresses return txouts and a summary OR amounts by address and a summary.
  find (params) {
    console.log('listunspent.find params.query: ', params.query)
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
      addressesBtc.length && importPromises.push(
        timeout(
          importmultiService.create({ addresses: addressesBtc, type: 'BTC' }),
          app.get('btcImportTimeout'),
          'BTC import timed out'
        )
      )
      addressesEqb.length && importPromises.push(
        timeout(
          importmultiService.create({ addresses: addressesEqb, type: 'EQB' }),
          app.get('eqbImportTimeout'),
          'EQB import timed out'
        )
      )
    }

    // If promises fail or time out, they resolve as undefined. This way, we
    // can select the successful ones after all requests are handled
    function parseResult (r) {
      if (r && r.data && r.data.result) {
        return resultToSatoshi(r.data.result)
      }
      return undefined
    }

    return Promise.all(importPromises)
    .catch(err => {
      console.warn('Import during listUnspent failed: ', err)
      return Promise.resolve()
    })
    .then(() => Promise.all([
      timeout(
        fetchListunspent(configBtc, addressesBtc).then(parseResult),
        app.get('btcRetrieveTimeout')
      ).catch(err => {
        console.warn('Error retrieving unspent BTC: ', err)
        return undefined
      }),
      timeout(
        fetchListunspent(configEqb, addressesEqb).then(parseResult),
        app.get('eqbRetrieveTimeout')
      ).catch(err => {
        console.warn('Error retrieving unspent EQB: ', err)
        return undefined
      })
    ]))
    .then(results => {
      // check if at least one request was successful
      if (results.some(r => r)) {
        return {
          BTC: results[0] && (byAddress ? aggregateByAddress(results[0]) : addSummary(results[0])),
          EQB: results[1] && (byAddress ? aggregateByAddress(results[1]) : addSummary(results[1]))
        }
      }
      // all requests failed, return an error
      return Promise.reject(new errors.GeneralError({ message: 'timed out' }))
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
