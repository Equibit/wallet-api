const assert = require('assert')
const bitcoin = require('bitcoinjs-lib')
const generateXpubs = require('./xpub')

describe('xpub utilities', function () {
  it('generates xpubs', function () {
    const xpubs = generateXpubs()
    assert.ok(bitcoin.HDNode.fromBase58(xpubs.btc, bitcoin.networks.testnet))
    assert.ok(bitcoin.HDNode.fromBase58(xpubs.eqb, bitcoin.networks.testnet))
  })
})
