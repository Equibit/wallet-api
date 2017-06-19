const assert = require('assert')
const axios = require('axios')
const formatRpcParams = require('../../utils/format-rpc-params')

module.exports = function (options) {
  const requestParams = [ 'url', 'username', 'password' ]

  assert(typeof options === 'object', 'you must pass options to the sendRawTxn hook')
  requestParams.forEach(param => {
    assert(options.hasOwnProperty(param), `You must provide an RPC \`${param}\` to the sendRawTxn hook`)
  })

  return function sendRawTxn (context) {
    const formattedParams = formatRpcParams([context.data.hex])

    return axios({
      method: 'POST',
      url: options.url,
      data: {
        jsonrpc: '1.0',
        method: 'sendrawtransaction',
        params: formattedParams
      },
      auth: {
        username: options.username,
        password: options.password
      }
    })
    .then(res => {
      context.params.coreTxnSuccess = true
      return context
    })
    .catch(err => {
      console.log('_______ PROXY ERROR: ', err.response.data)
      console.log('USING PARAMS: ', formattedParams)
      return err.response.data
    })
  }
}
