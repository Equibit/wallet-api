const { eqbTxBuilder, bitcoin } = require('@equibit/wallet-crypto')
const axios = require('axios')

const fee = 3000

function payout (hook, userAddress, rewardAmount, config) {
  const app = hook.app
  const sourceKP = {
    address: app.get('rewardAddress'),
    key: app.get('rewardKey')
  }
  const listUnspentService = app.service('listunspent')
  const txToUse = []
  let hexVal
  return listUnspentService.find({
    query: {
      eqb: [sourceKP.address],
      doImport: false,
      byAddress: false
    }
  }).then(
    unspent => {
      const utxo = unspent.EQB.txouts
      const total = unspent.EQB.summary.total
      if (total < rewardAmount) {
        console.error('Funds were not available to dispense an ico entitlement, refill ', sourceKP.address)
        throw new Error('insufficient funds')
      }
      let vinAmount = 0
      for (let tx of utxo) {
        txToUse.push({
          txid: tx.txid,
          vout: 0,
          keyPair: bitcoin.ECPair.fromWIF(sourceKP.key, bitcoin.networks.testnet)
        })
        vinAmount += tx.amount
        if (vinAmount > rewardAmount) {
          break
        }
      }
      const tx = eqbTxBuilder.builder.buildTx(
        {
          version: 2,
          locktime: 0,
          vin: txToUse,
          vout: [
            {
              address: userAddress,
              value: rewardAmount,
              equibit: {
                payment_currency: 0,
                payment_tx_id: '',
                issuance_tx_id: '0000000000000000000000000000000000000000000000000000000000000000',
                issuance_json: ''
              }
            },
            {
              address: sourceKP.address,
              value: vinAmount - (rewardAmount + fee),
              equibit: {
                payment_currency: 0,
                payment_tx_id: '',
                issuance_tx_id: '0000000000000000000000000000000000000000000000000000000000000000',
                issuance_json: ''
              }
            }
          ]
        },
        {
          network: bitcoin.networks.testnet,
          sha: 'SHA3_256'
        }
      )
      return tx
    }
  ).then(
    built => {
      hexVal = built.toString('hex')
    }
  ).then(
    () => axios({
      method: 'POST',
      url: config.url,
      data: {
        jsonrpc: '1.0',
        method: 'sendrawtransaction',
        params: [hexVal]
      },
      auth: {
        username: config.username,
        password: config.password
      }
    })
    .then(
      response => {
        return app.service('/transactions').create({
          fromAddress: sourceKP.address,
          toAddress: userAddress,
          addressTxId: txToUse[0].txId,
          addressVout: '0',
          type: 'TRANSFER',
          currencyType: 'EQB',
          amount: rewardAmount,
          fee: fee,
          txid: response.data.result,
          hex: hexVal
        })
      }
    )
  )
}

module.exports = function () {
  return function (hook) {
    if (hook.result.status === 'REWARDED' ||
      hook.result.manualPaymentRequired ||
      !hook.data.hasOwnProperty('address')) {
      return hook
    }

    const id = hook.result._id
    return hook.app.service('questionnaires').get(hook.result.questionnaireId)
    .then(questionnaire => {
      const reward = questionnaire.reward
      const balanceThreshold = 100 * 100000000
      if (reward < balanceThreshold) {
        const address = hook.data.address
        return payout(hook, address, reward, hook.app.get('equibitCore'))
          .then(
            () => hook.service.patch(id, {status: 'REWARDED', manualPaymentRequired: false}),
            () =>
              // Payment did not go through
              hook.service.patch(id, {manualPaymentRequired: true}))
      }
      return hook.service.patch(id, {manualPaymentRequired: true})
    },
    result => Promise.resolve(result)
    )
    .then(result => {
      hook.result = result
      return hook
    })
    .catch(err => {
      console.log(err.message)
      return hook
    })
  }
}
