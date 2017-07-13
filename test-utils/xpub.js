const bitcoin = require('bitcoinjs-lib')
const bip39 = require('bip39')

// To generate xpub (for testing).  The client app will do this, normally.
module.exports = function generateXpubs () {
  const mnemonic = bip39.generateMnemonic()
  const seed = bip39.mnemonicToSeed(mnemonic, '') // 2nd param is empty string
  const hdnode = bitcoin.HDNode.fromSeedBuffer(seed, bitcoin.networks.testnet)

  // Bitcoin xPub
  const btc = hdnode.derivePath("m/44'/0'/0'").neutered.toBase58() // type string
  // Equibit xPub
  const eqb = hdnode.derivePath("m/44'/72'/0'").neutered.toBase58() // type string

  return { btc, eqb }
}
