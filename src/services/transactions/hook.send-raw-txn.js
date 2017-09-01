const assert = require('assert')
const axios = require('axios')
const formatRpcParams = require('../../utils/format-rpc-params')

module.exports = function (options) {
  const requestParams = [ 'url', 'username', 'password' ]

  assert(typeof options === 'object', 'you must pass options to the sendRawTxn hook')
  requestParams.forEach(param => {
    assert(options.btc.hasOwnProperty(param), `You must provide an RPC \`${param}\` to the sendRawTxn hook`)
    assert(options.eqb.hasOwnProperty(param), `You must provide an RPC \`${param}\` to the sendRawTxn hook`)
  })

  return function sendRawTxn (context) {
    const formattedParams = formatRpcParams([context.data.hex])
    const currencyType = context.data.currencyType.toLowerCase()

    return axios({
      method: 'POST',
      url: options[currencyType].url,
      data: {
        jsonrpc: '1.0',
        method: 'sendrawtransaction',
        params: formattedParams
      },
      auth: {
        username: options[currencyType].username,
        password: options[currencyType].password
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
