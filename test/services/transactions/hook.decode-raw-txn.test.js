const app = require('../../../src/app')
const assert = require('assert')
const txnUtils = require('../../../test-utils/transactions')
const testHook = require('../../../src/services/transactions/hook.decode-raw-txn')

const decodeRawTxn = testHook({
  url: 'http://localhost:18332',
  username: 'test',
  password: 'test'
})

describe('Transactions Service - decodeRawTxn Hook', function () {
  before(function () {
    txnUtils.setupMock()
  })
  after(function () {
    txnUtils.resetMock()
  })

  it('uses the core to decode a raw transaction from hex', function (done) {
    const context = {
      app,
      params: { },
      data: {
        address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
        currencyType: 'BTC',
        hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
      }
    }

    decodeRawTxn(context)
      .then(context => {
        assert(typeof context.params.decodedTxn === 'object', 'the decoded transaction was in place')
        assert.deepEqual(context.params.decodedTxn, txnUtils.decodedTxn, 'the transactions matched')
        done()
      })
      .catch(error => {
        assert(!error, error.message)
        done()
      })
  })
})
