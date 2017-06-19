const app = require('../../../src/app')
const assert = require('assert')
const txnUtils = require('../../../test-utils/transactions')
const testHook = require('../../../src/services/transactions/hook.validate-txn')

txnUtils.mock()

const validateRawTxn = testHook({
  url: 'http://localhost:18332',
  username: 'test',
  password: 'test'
})

describe('Transactions Service - validateRawTxn Hook', function () {
  it('uses the core to validate a raw transaction', function (done) {
    const context = {
      app,
      params: {
        decodedTxn: txnUtils.decodedTxn
      },
      data: {
        address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
        addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
        addressVout: 0,
        currencyType: 'BTC',
        toAddress: '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z',
        hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
      }
    }

    validateRawTxn(context)
      .then(context => {
        assert(context.params.passedValidation, 'the transaction was valid')
        done()
      })
      .catch(error => {
        assert(!error, error.message)
        done()
      })
  })

  it('requires toAddress', function (done) {
    const context = {
      app,
      params: { },
      data: {
        address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
        addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
        addressVout: 0,
        currencyType: 'BTC',
        hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
      }
    }

    validateRawTxn(context)
      .then(context => {
        assert(!context, 'should have received bad request error')
        done()
      })
      .catch(error => {
        assert(error.className === 'bad-request', 'returned correct error class')
        assert(error.code === 400, 'returned correct error code')
        done()
      })
  })
})
