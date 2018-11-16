const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const mock = new MockAdapter(axios, { delayResponse: 20 })

const decodedTxn = {
  "version": 1,
  "vin": [
    {
      "txid": "a407f25c26d9cd24e24045ce5c272875a65ef5503ccfb711e662a399847e6e2c",
      "vout": 1,
      "scriptSig": {
        "asm": "30440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a[ALL] 033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46ad",
        "hex": "4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46ad"
      },
      "sequence": 4294967295
    }
  ],
  "vout": [
    {
      "value": 300000000,
      "scriptPubKey": {
        "hex": "76a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac",
        "type": "pubkeyhash",
        "asm": "OP_DUP OP_HASH160 ea3f916f7ad64b1ed044147d4b1df2af10ea9cb6 OP_EQUALVERIFY OP_CHECKSIG",
        "addresses": [
          "n2sYZjQFTC7vYLWSqX9Q8fjgtr5kb6GxYH"
        ]
      }
    },
    {
      "value": 49999000,
      "scriptPubKey": {
        "hex": "76a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac",
        "type": "pubkeyhash",
        "asm": "OP_DUP OP_HASH160 b0abfca92c8a1ae023220d4134fe72ff3273a309 OP_EQUALVERIFY OP_CHECKSIG",
        "addresses": [
          "mwd7FgMkm9yfPmNTnntsRbugZS7BEZaf32"
        ]
      }
    }
  ],
  "locktime": 0
}

const listunspentFixtureData = require('../src/services/listunspent/fixtures.json')
const handleListUnspent = function handleListUnspent (request) {
  const data = JSON.parse(request.data)

  if (data.method !== 'listunspent') {
    return undefined
  }

  return [200, listunspentFixtureData]
}

exports.decodedTxn = decodedTxn

exports.setupMock = function () {
  mock.onPost().reply(function (request) {
    const data = JSON.parse(request.data)

    switch (data.method) {
      case 'listunspent':
        return handleListUnspent(request)
      case 'importaddress':
        return [200, {
          result: {
            result: null,
            error: null,
            id: null
          }
        }]
      case 'importmulti':
        return [200, {
          result: [
            { success: true }
          ],
          error: null,
          id: null
        }]
      case 'sendrawtransaction':
        return [200, {
          result: '036fc4cbbb510a5845690bc48dc2883911e653e011e822259cda5551efc50c88',
          error: null,
          id: null
        }]
      case 'decoderawtransaction':
        return [200, {
          result: decodedTxn,
          error: null,
          id: null
        }]
      case 'gettxout':
        return [200, {
          result: {
            'bestblock': '00000000c92356f7030b1deeab54b3b02885711320b4c48523be9daa3e0ace5d',
            'confirmations': 0,
            'value': 0.00100000,
            'scriptPubKey': {
              'asm': 'OP_DUP OP_HASH160 a11418d3c144876258ba02909514d90e71ad8443 OP_EQUALVERIFY OP_CHECKSIG',
              'hex': '76a914a11418d3c144876258ba02909514d90e71ad844388ac',
              'reqSigs': 1,
              'type': 'pubkeyhash',
              'addresses': [ 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
                '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z' ]
            },
            'version': 1,
            'coinbase': false
          },
          error: null,
          id: null
        }]
      case 'getblock':
        return [200, {
          result: {
            'hash': '516251b576ab780a73d4f24f9a0f447984a38409c2cd05d1a99f30ae06b68f9d',
            'confirmations': 1,
            'strippedsize': 228,
            'size': 264,
            'weight': 948,
            'height': 1272,
            'version': 536870912,
            'versionHex': '20000000',
            'merkleroot': 'dbaa4e97ed83f7fa6f4dae191e5189880ab2fbcdae7a9a3edf2f86604a417c51',
            'tx': [
              '2e7c903a1f6269d7f938b9189f6ed250d45a9f5c83c870aad1892d3109437126'
            ],
            'time': 1522430842,
            'mediantime': 1522178441,
            'nonce': 3,
            'bits': '207fffff',
            'difficulty': 4.656542373906925e-10,
            'chainwork': '00000000000000000000000000000000000000000000000000000000000009bc',
            'previousblockhash': '24ebfa22e3165a2968a109a5ab7771312aea1caff0b66fe3d569315bab86fea8'
          }
        }]
      case 'getblockchaininfo':
        return [200, {
          'result': {
            'chain': 'regtest',
            'blocks': 1272,
            'headers': 1272,
            'bestblockhash': '516251b576ab780a73d4f24f9a0f447984a38409c2cd05d1a99f30ae06b68f9d',
            'difficulty': 4.656542373906925e-10,
            'mediantime': 1522178441,
            'verificationprogress': 1,
            'chainwork': '00000000000000000000000000000000000000000000000000000000000009bc',
            'pruned': false,
            'softforks': [{
              'id': 'bip34',
              'version': 2,
              'reject': {
                'status': false
              }
            },
            {
              'id': 'bip66',
              'version': 3,
              'reject': {
                'status': false
              }
            },
            {
              'id': 'bip65',
              'version': 4,
              'reject': {
                'status': false
              }
            }],
            'bip9_softforks': {
              'csv': {
                'status': 'active',
                'startTime': 0,
                'timeout': 999999999999,
                'since': 432
              },
              'segwit': {
                'status': 'active',
                'startTime': 0,
                'timeout': 999999999999,
                'since': 432
              }
            }
          },
          'error': null,
          'id': null
        }]
    }
  })
}

exports.resetMock = function resetTransactionsMock () {
  mock.reset()
}

exports.removeAll = function remove (app) {
  return app.service('/transactions').remove(null, {
    query: {
      fromAddress: {
        $in: [
          '000000000000000000000000',
          'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
          '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z'
        ]
      }
    }
  })
}

exports.history = () => mock.history
