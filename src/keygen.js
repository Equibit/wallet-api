const bitcoin = require('bitcoinjs-lib')
const icoPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
const icoAddress = icoPair.getAddress()
const icoKey = icoPair.toWIF()
const rewardPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
const rewardAddress = rewardPair.getAddress()
const rewardKey = rewardPair.toWIF()
const btcLoadPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
const btcLoadAddress = btcLoadPair.getAddress()
const btcLoadKey = btcLoadPair.toWIF()

const eqbLoadPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
const eqbLoadAddress = eqbLoadPair.getAddress()
const eqbLoadKey = eqbLoadPair.toWIF()

console.log(
`set the following environment variables to enable the server to make automated payments

  ICO_PAYOUT_ADDRESS: "${icoAddress}"
  ICO_PAYOUT_KEY: "${icoKey}"
  REWARD_ADDRESS: "${rewardAddress}"
  REWARD_KEY: "${rewardKey}"
  BTC_LOAD_ADDRESS: "${btcLoadAddress}"
  BTC_LOAD_KEY: "${btcLoadKey}"
  EQB_LOAD_ADDRESS: "${eqbLoadAddress}"
  EQB_LOAD_KEY: "${eqbLoadKey}"
`
)
