const axios = require('axios')
const crypto = require('crypto')
const queryString = require('query-string')

const defaults = {
  refreshTimeout: 5 * 60 * 1000,
  rootUrl: 'https://apiv2.bitcoinaverage.com/'
}

const actions = {
  convert: 'convert/{market}',  // also requires 'from', 'to', 'amount'
  tickers: 'indices/{market}/ticker/all', // optional 'crypto', 'fiat' -- this endpoint requires a paid account
  ticker: 'indices/{market}/ticker/{symbol}'
}

const queryDefaults = {
  market: 'global'
}

function formatAndDeleteKeys (str, obj) {
  return str.replace(/\{([^}]*)\}/g, function (match, key) {
    const replacement = obj[key]
    delete obj[key]
    return replacement
  })
}

const queryPromises = new Map()

class Service {
  constructor (options) {
    this.options = Object.assign(
      {},
      defaults,
      options.app.get('bitcoinAverage') || {},
      options || {}
    )
  }

  refreshFromService (url) {
    const publicComponent = parseInt(Date.now() / 1000).toString(10) + '.' + this.options.key
    const secretComponent = crypto.createHmac('sha256', this.options.secret).update(publicComponent).digest('hex')

    return axios({
      url,
      type: 'get',
      headers: {
        'X-signature': publicComponent + '.' + secretComponent
      }
    })
    .then(res => res.data)
    .catch(err => {
      console.log('_______ BITCOIN-AVERAGE ERROR: ', (err.response && err.response.data) || err.message)
      return (err.response && err.response.data) || {error: {message: err.message}}
    })
  }

  find (params) {
    const query = Object.assign({}, queryDefaults, params.query || {})
    let url = this.options.rootUrl + formatAndDeleteKeys(actions[params.query.action], query)
    url += '?' + queryString.stringify(query)
    let queryPromise = queryPromises.get(url)
    if (!queryPromise) {
      queryPromise = this.refreshFromService(url)
      queryPromises.set(url, queryPromise)
      setTimeout(() => {
        queryPromises.delete(url)
      }, this.options.refreshTimeout)
    }
    return queryPromise
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

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
