const axios = require('axios')
const formatParams = require('../../utils/format-rpc-params.js')

class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    const formattedParams = formatParams(params.query.params)
    const config = this.options.app.get('bitcoinCore')
    console.log('find params.query and config: ', params.query, config)

    return axios({
      method: 'POST',
      // url: 'http://99.227.230.43:8331',
      url: config.url,
      data: {
        jsonrpc: '1.0',
        method: params.query.method,
        params: formattedParams
      },
      auth: {
        username: config.username,
        password: config.password
      }
    })
    .then(res => res.data)
    .catch(err => {
      console.log('_______ PROXY ERROR: ', (err && err.response && err.response.data || err))
      console.log('USING PARAMS: ', formattedParams)
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

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
