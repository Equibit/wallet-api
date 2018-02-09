const axios = require('axios')
// const errors = require('feathers-errors')
const formatParams = require('../../utils/format-rpc-params.js')

class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    const formattedParams = formatParams(params.query.params)
    const node = params.query.node || 'btc'
    const config = this.options.app.get(node === 'eqb' ? 'equibitCore' : 'bitcoinCore')
    console.log('PROXYCORE: find params.query and config: ', params.query, config)

    // Disable blockchain rescan since it takes several minutes even for TestNet:
    if (params.query.method === 'importaddress') {
      formattedParams[1] = ''
      formattedParams[2] = false
    }

    console.log('formattedParams', formattedParams)
    return axios({
      method: 'POST',
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
      console.log('_______ PROXYCORE ERROR: ', (err.response && err.response.data) || err.message)
      console.log('USING PARAMS: ', JSON.stringify(formattedParams, null, 2))
      return (err.response && err.response.data) || {error: {message: err.message}}
      // throw new errors.GeneralError(err.response && err.response.data) || {error: {message: err.message}}
    })
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    })
  }

  create (data, params) {
    console.log(`create:: `, data, params)
    return this.find({
      query: data
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

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
