const assert = require('assert')
const axios = require('axios')
const formatRpcParams = require('../../../utils/format-rpc-params')
const errors = require('feathers-errors')

module.exports = function (options) {
  const requestParams = [ 'url', 'username', 'password' ]
  requestParams.forEach(param => {
    assert(options.btc.hasOwnProperty(param), `You must provide an RPC \`${param}\` to the sendRawTxn hook`)
    assert(options.eqb.hasOwnProperty(param), `You must provide an RPC \`${param}\` to the sendRawTxn hook`)
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
    const doesAddressMatch = decodedTxn.vout.reduce((acc, a) => {
      // For a regular P2PKH output we check the address:
      if (a.scriptPubKey.type === 'pubkeyhash') {
        return acc || a.scriptPubKey.addresses.includes(context.data.toAddress)
      } else if (a.scriptPubKey.type === 'nonstandard' && a.scriptPubKey.asm.search('OP_CHECKLOCKTIMEVERIFY') !== -1) {
        // todo: for HTLC output check address against its hex representation.
        return true
      }
      return true
    }, false)
    if (!doesAddressMatch) {
      return Promise.reject(new errors.BadRequest('The `toAddress` did not match any address in the transaction\'s `vout` addresses'))
    }

    // Make sure the `address`, `addressTxid`, and `addressVout` are all provided
    const addressAttrs = ['address', 'addressTxid', 'addressVout']
    const missingAttr = addressAttrs.reduce((acc, attr) => {
      return acc || (!context.data.hasOwnProperty(attr) && attr) || acc
    }, '')
    if (missingAttr) {
      return Promise.reject(new errors.BadRequest(`\`${missingAttr}\` is required to record a transaction`))
    }

    // Make sure the provided `addressTxid` and `addressVout` combination exist in the decodedTxn output
    const addressData = context.data.addressTxid + '.' + context.data.addressVout
    const addressMatched = decodedTxn.vin.reduce((foundMatch, vin) => {
      return foundMatch || vin.txid + '.' + vin.vout === addressData
    }, false)
    if (!addressMatched) {
      return Promise.reject(new errors.BadRequest(`The \`addressTxid\` and \`addressVout\` did not match any of those found in the decoded transaction's \`vin\`.`))
    }

    const formattedParams = formatRpcParams([context.data.addressTxid, context.data.addressVout])
    const currencyType = context.data.currencyType.toLowerCase()
    return axios({
      method: 'POST',
      url: options[currencyType].url,
      data: {
        jsonrpc: '1.0',
        method: 'gettxout',
        params: formattedParams
      },
      auth: {
        username: options[currencyType].username,
        password: options[currencyType].password
      }
    })
    // make a request to gettxout and validate
    .then(response => {
      // Note: `gettxout` returns null if UTXO has already been spent.
      if (!response.data.result) {
        const details = `[${formattedParams[0]}, ${formattedParams[1]}]`
        return Promise.reject(
          new errors.BadRequest(`The provided UTXO has already been spent. Result of "gettxout" is null for ${details}.`)
        )
      }
      // Make sure `context.data.address` matches one of the gettxout response's scriptPubKey.addresses.
      console.log(`hook.validate-txn: gettxout with formattedParams, result:`, formattedParams, response.data.result)
      if (response.data.result.scriptPubKey.addresses && !response.data.result.scriptPubKey.addresses.includes(context.data.address)) {
        return Promise.reject(
          new errors.BadRequest(`The provided "address" did not match the "gettxout" verification for ${formattedParams.toString()}`)
        )
      }

      // Flag the request as having passed validation and return.
      context.params.passedValidation = true
      return context
    })
  }
}
