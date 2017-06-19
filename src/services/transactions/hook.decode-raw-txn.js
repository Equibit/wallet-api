const axios = require('axios')
const formatRpcParams = require('../../utils/format-rpc-params')

module.exports = function (options) {
  const requestParams = [ 'url', 'username', 'password' ]
  requestParams.forEach(param => {
    if (!options[param]) {
      throw new Error(`You must provide an RPC \`${param}\` to the decodeRawTxn hook`)
    }
  })

  return function decodeRawTxn (context) {
    const formattedParams = formatRpcParams([context.data.hex])

    return axios({
      method: 'POST',
      url: options.url,
      data: {
        jsonrpc: '1.0',
        method: 'decoderawtransaction',
        params: formattedParams
      },
      auth: {
        username: options.username,
        password: options.password
      }
    })
    .then(response => {
      context.params.decodedTxn = response.data.result
      return context
    })
    .catch(err => {
      console.log('_______ PROXY ERROR: ', err.response.data)
      console.log('USING PARAMS: ', formattedParams)
      return err.response.data
    })
  }
}
