const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const mock = new MockAdapter(axios)

const decodedTxn = {
  'txid': '52309405287e737cf412fc42883d65a392ab950869fae80b2a5f1e33326aca46',
  'hash': '52309405287e737cf412fc42883d65a392ab950869fae80b2a5f1e33326aca46',
  'size': 223,
  'vsize': 223,
  'version': 1,
  'locktime': 0,
  'vin': [
    {
      'txid': '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
      'vout': 0,
      'scriptSig': {
        'asm': '3044022013d212c22f0b46bb33106d148493b9a9723adb2c3dd3a3ebe3a9c9e3b95d8cb00220461661710202fbab550f973068af45c294667fc4dc526627a7463eb23ab39e9b[ALL] 0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
        'hex': '473044022013d212c22f0b46bb33106d148493b9a9723adb2c3dd3a3ebe3a9c9e3b95d8cb00220461661710202fbab550f973068af45c294667fc4dc526627a7463eb23ab39e9b01410479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8'
      },
      'sequence': 4294967295
    }
  ],
  'vout': [
    {
      'value': 0.06990000,
      'n': 0,
      'scriptPubKey': {
        'asm': 'OP_DUP OP_HASH160 01b81d5fa1e55e069e3cc2db9c19e2e80358f306 OP_EQUALVERIFY OP_CHECKSIG',
        'hex': '76a91401b81d5fa1e55e069e3cc2db9c19e2e80358f30688ac',
        'reqSigs': 1,
        'type': 'pubkeyhash',
        'addresses': [
          '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z'
        ]
      }
    }
  ]
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
              'addresses': [ 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32' ]
            },
            'version': 1,
            'coinbase': false
          },
          error: null,
          id: null
        }]
    }
  })
}

exports.resetMock = function resetTransactionsMock () {
  mock.reset()
}
