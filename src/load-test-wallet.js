/* Script to load test wallets running e2e tests */
const { bitcoin, eqbTxBuilder, txBuilder } = require('@equibit/wallet-crypto/dist/wallet-crypto')

const path = require('path')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const axios = require('axios')

const app = feathers().configure(configuration(path.join(__dirname, '..')))
const config = app.get('loadTestWallet')
const configMempool = app.get('mempool')
const configBTC = app.get('bitcoinCore')
const configEQB = app.get('equibitCore')

const defaultFee = 3000

let hexVal
let network = bitcoin.networks.testnet
let rate = 5
let fee

// BTC
console.log('Loading BTC...')
axios.get(`http://localhost:3030/proxycore?node=btc&method=listunspent&params[0]=0&params[1]=99999&params[2][]=${config.BTCLoadAddress}`)
  .then(unspent => {
    if (unspent.data.result.length === 0) {
      throw new Error(`no funds in ${config.BTCLoadAddress}, refill`)
    }
    const utxo = unspent.data.result
    const txToUse = []
    let transferAmount = config.transferAmount
    let vinAmount = 0
    for (let tx of utxo) {
      txToUse.push({
        txid: tx.txid,
        vout: tx.vout,
        keyPair: bitcoin.ECPair.fromWIF(config.BTCLoadKey, network)
      })
      vinAmount += tx.amount
      if (vinAmount > transferAmount) {
        break
      }
    }
    vinAmount = Math.floor(vinAmount * 100000000)
    transferAmount = Math.floor(transferAmount * 100000000)
    const txInfo = {
      version: 2,
      locktime: 0,
      vin: txToUse,
      vout: [
        {
          address: configMempool.btcAddress,
          value: transferAmount
        },
        {
          address: config.BTCLoadAddress,
          value: vinAmount - (transferAmount + defaultFee)
        }
      ]
    }
    const predictedTx = txBuilder.builder.buildTx(
      txInfo,
      {
        network
      }
    )
    fee = predictedTx.toString('hex').length * rate / 2
    txInfo.vout[1].value += defaultFee
    txInfo.vout[1].value -= fee
    const tx = txBuilder.builder.buildTx(
      txInfo,
      {
        network
      }
    )
    return tx
  }).then(built => {
    hexVal = built.toString('hex')
  }).then(
  () => axios({
    method: 'POST',
    url: configBTC.url,
    data: {
      jsonrpc: '1.0',
      method: 'sendrawtransaction',
      params: [hexVal]
    },
    auth: {
      username: configBTC.username,
      password: configBTC.password
    }
  }),
  console.log('BTC loaded.')
  ).catch(err => {
    if (err.response) {
      console.error('BTC Error: ', err.response.data.error)
    }
    throw new Error(err)
  })

// EQB
console.log('Loading EQB...')
axios.get(`http://localhost:3030/proxycore?node=eqb&method=listunspent&params[0]=0&params[1]=99999&params[2][]=${config.EQBLoadAddress}`)
 .then(unspent => {
   if (unspent.data.result.length === 0) {
     throw new Error(`no funds in ${config.EQBLoadAddress}, refill`)
   }
   const utxo = unspent.data.result
   const txToUse = []
   let transferAmount = config.transferAmount
   let vinAmount = 0
   for (let tx of utxo) {
     txToUse.push({
       txid: tx.txid,
       vout: tx.vout,
       keyPair: bitcoin.ECPair.fromWIF(config.EQBLoadKey, network)
     })
     vinAmount += tx.amount
     if (vinAmount > transferAmount) {
       break
     }
   }
   vinAmount *= 100000000
   transferAmount *= 100000000
   const txInfo = {
     version: 2,
     locktime: 0,
     vin: txToUse,
     vout: [
       {
         address: configMempool.eqbAddress,
         value: transferAmount,
         equibit: {
           payment_currency: 0,
           payment_tx_id: '',
           issuance_tx_id: '0000000000000000000000000000000000000000000000000000000000000000',
           issuance_json: ''
         }
       },
       {
         address: config.EQBLoadAddress,
         value: vinAmount - (transferAmount + defaultFee),
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
 }).then(built => {
   hexVal = built.toString('hex')
 }).then(
 () => axios({
   method: 'POST',
   url: configEQB.url,
   data: {
     jsonrpc: '1.0',
     method: 'sendrawtransaction',
     params: [hexVal]
   },
   auth: {
     username: configEQB.username,
     password: configEQB.password
   }
 }),
 console.log('EQB loaded.')
 ).catch(err => {
   if (err.response) {
     console.error('EQB Error: ', err.response.data.error)
   }
   throw new Error(err)
 })
