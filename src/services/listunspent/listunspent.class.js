const axios = require('axios')

// http://localhost:3030/proxycore?method=listunspent&params[0]=0&params[1]=99999&params[2][]=mp9GiieHrLQvLu4C8nE9bbwxNmXqcC3nVf&params[2][]=mwd7FgMkm9yfPmNTnntsRbugZS7BEZaf32

class Service {
  constructor (options) {
    this.options = options || {}
  }

  // Given a list of addresses return txouts and a summary OR amounts by address and a summary.
  find (params) {
    console.log('listunspent.find params.query: ', params.query)
    const addressesBtc = params.query.btc || []
    const addressesEqb = params.query.eqb || []
    const byAddress = !!params.query.byaddress

    const config = this.options.app.get('bitcoinCore')

    return Promise.all([
      fetchListunspent(config, 'btc', addressesBtc),
      fetchListunspent(config, 'eqb', addressesEqb)
    ]).then(results => {
      return {
        btc: byAddress ? aggregateByAddress(results[0].data.result) : addSummary(results[0].data.result),
        eqb: byAddress ? aggregateByAddress(results[1].data.result) : addSummary(results[1].data.result)
      }
    })
    .catch(err => {
      console.log('_______ PROXY ERROR: ', err.response.data)
      return err.response.data
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

function fetchListunspent (config, type, addresses = []) {
  if (!addresses.length) {
    return Promise.resolve({data: {result: []}})
  }
  console.log('fetchListunspent', arguments)

  return axios({
    method: 'POST',
    url: config.url,
    data: {
      jsonrpc: '1.0',
      method: 'listunspent',
      params: [0, 99999, addresses]
    },
    auth: {
      username: config.username,
      password: config.password
    }
  })
}

function aggregateByAddress (result) {
  return result.reduce((acc, txout) => {
    acc.summary.total += txout.amount
    if (!acc[txout.address]) {
      acc[txout.address] = {
        amount: 0,
        txouts: []
      }
    }
    acc[txout.address].amount += txout.amount
    acc[txout.address].txouts.push(txout)
    return acc
  }, {summary: {total: 0}})
}

function addSummary (result) {
  const summary = result.reduce((acc, txout) => {
    acc.summary.total += txout.amount
    return acc
  }, {summary: {total: 0}})
  summary.txouts = result
  return summary
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
