const axios = require('axios')
const formatRpcParams = require('../../utils/format-rpc-params')
const errors = require('feathers-errors')

module.exports = function (options) {
  const requestParams = [ 'url', 'username', 'password' ]
  requestParams.forEach(param => {
    if (!options[param]) {
      throw new Error(`You must provide an RPC \`${param}\` to the validateRawTxn hook`)
    }
  })

  return function validateRawTxn (context) {
    const decodedTxn = context.params.decodedTxn

    // Make sure that `toAddress` was provided.
    if (!context.data.toAddress) {
      return Promise.reject(new errors.BadRequest('`toAddress` is required to record a transaction'))
    }

    // Make sure `toAddress` matches one of the `vout.scriptPubKey.addresses` which will contain
    // the receipient's address and (likely) the change address of the sender.
    // This is done first because it doesn't require an RPC call & if it fails we can skip the RPC call.
    if (!decodedTxn.vout[0].scriptPubKey.addresses.includes(context.data.toAddress)) {
      return Promise.reject(new errors.BadRequest('The `toAddress` did not match any address in the transaction\'s `vout` addresses'))
    }

    // Make sure the `address`, `addressTxid`, and `addressVout` are all provided
    const addressAttrs = ['address', 'addressTxid', 'addressVout']
    addressAttrs.forEach(attr => {
      if (!context.data[attr]) {
        return Promise.reject(new errors.BadRequest(`\`${attr}\` is required to record a transaction`))
      }
    })

    // Make sure the provided `addressTxid` and `addressVout` combination exist in the decodedTxn output
    const addressData = context.data.addressTxid + '.' + context.data.addressVout
    const addressMatched = decodedTxn.vin.reduce((foundMatch, vin) => {
      return foundMatch || vin.txid + '.' + vin.vout === addressData
    }, false)
    if (!addressMatched) {
      return Promise.reject(new errors.BadRequest(`The \`addressTxid\` and \`addressVout\` did not match any of those found in the decoded transaction's \`vin\`.`))
    }

    const formattedParams = formatRpcParams([context.data.addressTxid, context.data.addressVout])
    return axios({
      method: 'POST',
      url: options.url,
      data: {
        jsonrpc: '1.0',
        method: 'gettxout',
        params: formattedParams
      },
      auth: {
        username: options.username,
        password: options.password
      }
    })
    // make a request to gettxout and validate
    .then(response => {
      // Make sure `context.data.address` matches one of the gettxout response's scriptPubKey.addresses.
      if (!response.data.result.scriptPubKey.addresses.includes(context.data.address)) {
        return Promise.reject(new errors.BadRequest('The provided `address` did not match the `gettxout` verification for ' + formattedParams.toString()))
      }

      // Flag the request as having passed validation and return.
      context.params.passedValidation = true
      return context
    })
    .catch(err => {
      console.log('_______ PROXY ERROR: ', err.response.data)
      console.log('USING PARAMS: ', formattedParams)
      return err.response.data
    })
  }
}
