const { bitcoin, eqbTxBuilder } = require('@equibit/wallet-crypto/dist/wallet-crypto')

const axios = require('axios')

const defaultFee = 3000

/**
 * listUnspentService
 * blockchainInfoService
 * transactionService
 * transactionNotesService
 * userAddr
 * srcAddr
 * srcKey
 * message
 */
function payout (app, srcAddress, srcKey, userAddress, rewardAmount, message) {
  const sourceKP = {
    address: srcAddress,
    key: srcKey
  }
  const config = app.get('equibitCore')
  const listUnspentService = app.service('listunspent')
  const txToUse = []
  let hexVal
  let network = bitcoin.networks.testnet
  let rate = 5
  let fee
  return app.service('blockchain-info').find({query: {
    coinType: 'EQB'
  }}).then(info => {
    if (info[0] && info[0].mode === 'main') {
      network = bitcoin.networks.bitcoin
    }
    if (info[0] && info[0].rate && info[0].rate.regular) {
      rate = info[0].rate.regular
    }
  }).then(() => listUnspentService.find({
    query: {
      eqb: [sourceKP.address],
      doImport: false,
      byAddress: false
    }
  })).then(
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
          keyPair: bitcoin.ECPair.fromWIF(sourceKP.key, network)
        })
        vinAmount += tx.amount
        if (vinAmount > rewardAmount) {
          break
        }
      }
      const txInfo = {
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
            value: vinAmount - (rewardAmount + defaultFee),
            equibit: {
              payment_currency: 0,
              payment_tx_id: '',
              issuance_tx_id: '0000000000000000000000000000000000000000000000000000000000000000',
              issuance_json: ''
            }
          }
        ]
      }
      const predictedTx = eqbTxBuilder.builder.buildTx(
        txInfo,
        {
          network,
          sha: 'SHA3_256'
        }
      )
      fee = predictedTx.toString('hex').length * rate / 2
      txInfo.vout[1].value += defaultFee
      txInfo.vout[1].value -= fee
      const tx = eqbTxBuilder.builder.buildTx(
        txInfo,
        {
          network,
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
    }).then(
      response => app.service('/transactions').create({
        fromAddress: sourceKP.address,
        toAddress: userAddress,
        addressTxId: txToUse[0].txId,
        addressVout: '0',
        type: 'TRANSFER',
        currencyType: 'EQB',
        amount: rewardAmount,
        fee,
        txId: response.data.result,
        hex: hexVal
      }).then(() => app.service('transaction-notes').create({
        txId: txToUse[0].txId,
        address: sourceKP.address,
        description: message
      }))
    )
  )
}

module.exports = function () {
  return hook => {
    const investorsService = hook.app.service('icoinvestors')
    let addressEQB
    const email = (hook.params.user && hook.params.user.email) || hook.data.email
    if (hook.data.type === 'EQB') {
      addressEQB = hook.data.importAddress
    }
    if (email && addressEQB) {
      const balanceThreshold = hook.app.get('icoPayoutThreshold') * 100000000
      const random = Math.random()
      // use patch rather than find to atomically check and set the locked field
      return investorsService.patch(null, {locked: random}, {query: {
        locked: 0,
        email,
        status: 'OWED'
      }})
        .then((data) => {
          if (data[0]) {
            if (data[0].locked !== random) {
              // another instance of this service has the lock
              return
            }
            // If balance is less than threshold, that means we can automatically dispense and delete. If it is not, then it is manual
            if (data[0].balanceOwed !== null && data[0].balanceOwed < balanceThreshold) {
              // Here we add the payment methods, payable to EQB address of user
              // Then remove the entry
              const app = hook.app
              return payout(app, app.get('icoPayoutAddress'), app.get('icoPayoutKey'), addressEQB, data[0].balanceOwed, 'Automated ICO payment').then(
                () => investorsService.patch(data[0]._id, { address: null, status: 'PAID', locked: 0 }),
                // in the case of a failed payment, flag the record as needing to be manually handled
                err => {
                  console.log('error sending an ico payment:', err.message)
                  return investorsService.patch(
                    data[0]._id,
                    { address: addressEQB,
                      status: 'MANUALREQUIRED',
                      locked: 0,
                      error: err.message
                    })
                })
            } else {
              return investorsService.patch(
                data[0]._id,
                {
                  address: addressEQB,
                  status: 'MANUALREQUIRED',
                  locked: 0
                })
            }
          }
        }).then(() => hook, () => hook)
    } else {
      return hook
    }
  }
}
