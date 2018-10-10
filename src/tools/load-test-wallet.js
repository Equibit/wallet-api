/* Script to load test wallets running e2e tests */
const { bitcoin, eqbTxBuilder, txBuilder } = require('@equibit/wallet-crypto/dist/wallet-crypto')
const users = require('../services/users/users.seed.json')
const { email: emailEQB, _plainEQBaddress: plainEQBaddress } = users[0]
const { email: emailBTC, _plainBTCaddress: plainBTCaddress } = users[2]

const path = require('path')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const axios = require('axios')

const app = feathers().configure(configuration(path.join(__dirname, '..')))
const config = app.get('loadTestWallet')
const configBTC = app.get('bitcoinCore')
const configEQB = app.get('equibitCore')

const defaultFee = 3000

let hexVal
let network = bitcoin.networks.testnet

// BTC
console.log(`Loading BTC into ${emailBTC}...`)
axios.get(`https://api-qa-wallet.equibitgroup.com/proxycore?node=btc&method=listunspent&params[0]=0&params[1]=99999&params[2][]=${config.BTCLoadAddress}`)
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
      vinAmount += Math.floor(tx.amount * 100000000)
      if (vinAmount > transferAmount) {
        break
      }
    }
    if (vinAmount < transferAmount + defaultFee) {
      console.error('Funds were not available to load with btc, refill', config.BTCLoadAddress)
      throw new Error(`insufficient funds in ${config.BTCLoadAddress}`)
    }
    const txInfo = {
      version: 2,
      locktime: 0,
      vin: txToUse,
      vout: [
        {
          address: plainBTCaddress,
          value: transferAmount
        },
        {
          address: config.BTCLoadAddress,
          value: vinAmount - (transferAmount + defaultFee)
        }
      ]
    }
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
  })
  ).catch(err => {
    if (err.response) {
      console.error('BTC Error: ', err.response.data.error)
    }
    console.error('BTC Error...')
    throw new Error(err)
  })

// EQB
console.log(`Loading EQB to ${emailEQB}...`)
axios.get(`https://api-qa-wallet.equibitgroup.com/proxycore?node=eqb&method=listunspent&params[0]=0&params[1]=99999&params[2][]=${config.EQBLoadAddress}`)
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
     vinAmount += Math.floor(tx.amount * 100000000)
     if (vinAmount > transferAmount) {
       break
     }
   }
   if (vinAmount < transferAmount + defaultFee) {
     console.error('Funds were not available to load with eqb, refill', config.EQBLoadAddress)
     throw new Error(`insufficient funds in ${config.EQBLoadAddress}`)
   }
   const txInfo = {
     version: 2,
     locktime: 0,
     vin: txToUse,
     vout: [
       {
         address: plainEQBaddress,
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
 })
 ).catch(err => {
   if (err.response) {
     console.error('EQB Error: ', err.response.data.error)
   }
   console.error('EQB Error...')
   throw new Error(err)
 })
