const bitcoin = require('bitcoinjs-lib')
const icoPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
const icoAddress = icoPair.getAddress()
const icoKey = icoPair.toWIF()
const rewardPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
const rewardAddress = rewardPair.getAddress()
const rewardKey = rewardPair.toWIF()
console.log(
`set the following environment variables to enable the server to make automated payments
{
  "icoPayoutAddress": "${icoAddress}",
  "icoPayoutKey": "${icoKey}",
  "rewardAddress": "${rewardAddress}",
  "rewardKey": "${rewardKey}",
}`
)
