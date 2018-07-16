const { builder } = require('tx-builder-equibit')
const bitcoin = require('bitcoinjs-lib')

function payout (hook, userAddress, rewardAmount) {
  const app = hook.app
  const sourceKP = {
    address: app.get('icoPayoutAddress'),
    key: app.get('icoPayoutKey')
  }
  const listUnspentService = app.service('listunspent')
  const txToUse = []
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
      return builder.buildTx({
        version: 1,
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
            value: vinAmount - rewardAmount,
            equibit: {
              payment_currency: 0,
              payment_tx_id: '',
              issuance_tx_id: '0000000000000000000000000000000000000000000000000000000000000000',
              issuance_json: ''
            }
          }
        ]
      })
    }
  ).then(
    builtTransaction => {
      return app.service('/transactions').create({
        fromAddress: sourceKP.address,
        toAddress: userAddress,
        addressTxId: txToUse[0].txId,
        addressVout: '0',
        type: 'TRANSFER',
        currencyType: 'EQB',
        amount: rewardAmount,
        fee: 0,
        hex: builtTransaction.toString('hex')
      })
    }
  )
}

module.exports = function () {
  return hook => {
    const investorsService = hook.app.service('icoinvestors')
    const balanceThreshold = 100
    let addressEQB
    const email = (hook.params.user && hook.params.user.email) || hook.data.email
    if (hook.data.type === 'EQB') {
      addressEQB = hook.data.importAddress
    }
    if (email && addressEQB) {
      return investorsService.find({ query: { email } })
      .then(({ data }) => {
        if (data[0]) {
          // If balance is less than threshold, that means we can automatically dispense and delete. If it is not, then it is manual
          if (data[0].balanceOwed < balanceThreshold) {
            // Here we add the payment methods, payable to EQB address of user
            // Then remove the entry
            return payout(hook, addressEQB, data[0].balanceOwed).then(() =>
              investorsService.remove(null, { query: { email } })
            )
          } else {
            return investorsService.patch(
              data[0]._id,
              { address: addressEQB,
                manualPaymentRequired: true
              }).then(() => hook)
          }
        } else {
          return hook
        }
      })
    } else {
      return Promise.resolve(hook)
    }
  }
}
