const assert = require('assert')
const axios = require('axios')
const formatRpcParams = require('../../../utils/format-rpc-params')

module.exports = function (options) {
  const requestParams = [ 'url', 'username', 'password' ]
  requestParams.forEach(param => {
    assert(options.btc.hasOwnProperty(param), `You must provide an RPC \`${param}\` to the sendRawTxn hook`)
    assert(options.eqb.hasOwnProperty(param), `You must provide an RPC \`${param}\` to the sendRawTxn hook`)
  })

  return function decodeRawTxn (context) {
    const formattedParams = formatRpcParams([context.data.hex])
    const currencyType = context.data.currencyType.toLowerCase()
    // console.log(`hook.decodeRawTxn: currencyType=${currencyType}, data=${JSON.stringify(context.data)}`)

    return axios({
      method: 'POST',
      url: options[currencyType].url,
      data: {
        jsonrpc: '1.0',
        method: 'decoderawtransaction',
        params: formattedParams
      },
      auth: {
        username: options[currencyType].username,
        password: options[currencyType].password
      }
    })
    .then(response => {
      context.params.decodedTxn = response.data.result
      return context
    })
    .catch(err => {
      console.log('_______ decoderawtransaction ERROR: ', err.response.data)
      console.log('USING PARAMS: ', formattedParams)
      console.log('All context.data: ', context.data)
      throw new Error(JSON.stringify(err.response.data))
    })
  }
}
