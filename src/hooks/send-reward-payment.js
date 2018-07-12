const { buildTx } = require('@Equibit/tx-builder-equibit')

module.exports = function () {
  return hook => {
    const sourceKP = {
      address: app.get('rewardAddress'),
      key: app.get('rewardKey')
    }
    const app = hook.app
    const listUnspentService = app.service('/listUnspent')
    const userAddress = hook.data.rewardAddress
    const rewardAmount = hook.data.rewardAmount
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
          return // err
        }
        let vinAmount = 0
        for (let tx of utxo) {
          txToUse.push({
            txid: tx.txid,
            vout: 0,
            keyPair: sourceKP
          })
          vinAmount += tx.amount
          if (vinAmount > rewardAmount) {
            break
          }
        }
        return buildTx({
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
      builtTransaction => app.service('/transactions').create({
        fromAddress: sourceKP.address,
        toAddress: userAddress,
        addressTxId: txToUse[0].txId,
        addressVout: '0',
        type: 'TRANSFER',
        currencyType: 'EQB',
        amount: rewardAmount,
        fee: 0,
        hex: builtTransaction.hex
      })
    )

    // const data = Object.keys(options.fields).reduce((data, key) => {
    //   const typeOfField = typeof options.fields[key]
    //   if (typeOfField === 'string') {
    //     data[key] = getByDot(hook, options.fields[key])
    //   } else if (typeOfField === 'function') {
    //     data[key] = options.fields[key].call(null, hook)
    //   }
    //   return data
    // }, {})

    // service.create({
    //   address: typeof options.addressPath === 'string'
    //     ? getByDot(hook, options.addressPath)
    //     : options.addressPath.call(null, hook),
    //   type: options.type || hook.service.path,
    //   isRead: false,
    //   data
    // }).catch(console.error.bind(console))

    // return hook
  }
}
