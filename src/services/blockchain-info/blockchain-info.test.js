const assert = require('assert')
const app = require('../../app')
const fixtureBlockchain = require('./fixture-blockchain.json')
const fixtureDB = require('./fixture-db.json')
const blockchainInfoService = require('./blockchain-info.service')
const {
  checkBlockchain,
  normalizeBlockchainInfo,
  compareInfo,
  getFromBlockchain,
  updateDB,
  getFromDB
} = blockchainInfoService
const proxycoreUtils = require('../../../test-utils/transactions')
const offerUtils = require('../../../test-utils/offers')

describe('\'blockchain-info\' service', () => {
  const fixtureNormalized = {
    mode: 'regtest',
    status: true,
    currentBlockHeight: 1271,
    bestblockhash: '1962811fcbe887ad37049cc33bf635e3e3ba6a955aacd5edd436ba708c552445',
    difficulty: 4.656542373906925e-10,
    'mediantime': 1521682385,
    errorMessage: ''
  }
  const service = {
    patch: () => Promise.resolve(fixtureDB.data[0]),
    find: () => Promise.resolve(fixtureDB)
  }
  const proxycoreService = {
    find: () => Promise.resolve(fixtureBlockchain)
  }

  it('registered the service', () => {
    const service = app.service('blockchain-info')

    assert.ok(service, 'Registered the service')
  })

  describe('compareInfo', function () {
    it('should return no newData if no change found', function () {
      const current = {mode: 'regtest', status: true, currentBlockHeight: 1271, _id: 100}
      const newData = {mode: 'regtest', status: true, currentBlockHeight: 1271}
      assert.deepEqual(compareInfo('BTC')([current, newData]), {id: 100})
    })
    it('should return newData if a change was found', function () {
      const current = {mode: 'regtest', status: true, currentBlockHeight: 1271, _id: 100}
      const newData = {mode: 'regtest', status: true, currentBlockHeight: 1272}
      assert.deepEqual(compareInfo('BTC')([current, newData]), {newData, id: 100})
    })
  })
  describe('normalizeBlockchainInfo', function () {
    it('should normalize blockchainInfo data', function () {
      assert.deepEqual(normalizeBlockchainInfo('BTC')(fixtureBlockchain), fixtureNormalized)
    })
  })
  describe('getFromBlockchain', function () {
    it('should return normalized data from blockchain service', function (done) {
      getFromBlockchain(proxycoreService, 'BTC').then(result => {
        assert.deepEqual(result, fixtureNormalized)
        done()
      })
    })
  })
  describe('updateDB', function () {
    it('should update DB if a change detected', function (done) {
      updateDB(service, 'BTC')({ newData: {status: 0}, id: 100 }).then(result => {
        assert.deepEqual(result, fixtureDB.data[0])
        done()
      })
    })
    it('should not patch DB, and instead return true', function (done) {
      updateDB(service, 'BTC')({ id: 100 }).then(result => {
        assert.equal(result, true)
        done()
      })
    })
    it('should update transactions in the new block', function (done) {
      proxycoreUtils.setupMock()
      // from test-utils/transactions.js
      const txId = '2e7c903a1f6269d7f938b9189f6ed250d45a9f5c83c870aad1892d3109437126'
      offerUtils.createOrder(app)
      .then(order => {
        return offerUtils.createOffer(app, { orderId: order._id.toString() })
      })
      .then(offer => {
        return app.service('/transactions').create({
          txId,
          offerId: offer._id.toString(),
          address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
          addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
          addressVout: 0,
          type: 'BUY',
          currencyType: 'BTC',
          toAddress: '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z',
          amount: 777123,
          fee: 0.0001,
          costPerShare: 3,
          hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
        })
      })
      .then(_tx => {
        return getFromDB(app.service('/blockchain-info'), 'BTC')
      })
      .then(info => {
        // prime the info to parse one block
        info.currentBlockHeight = 1271
        return app.service('blockchain-info').update(info._id, info)
      })
      .then(info => {
        return updateDB(app.service('blockchain-info'), 'BTC')({ id: info._id, newData: { currentBlockHeight: 1272 } })
      })
      .then(() => {
        return app.service('/transactions').find({
          query: {
            address: { $in: ['mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32'] },
            txId
          }
        })
      })
      .then(result => {
        const tx = result.data[0]
        assert.equal(tx.confirmationBlockHeight, 1272, 'transaction gets confirmed')
        return app.service('/transactions').remove(tx._id)
      })
      .then(() => {
        proxycoreUtils.resetMock()
        done()
      })
      .catch(err => {
        proxycoreUtils.resetMock()
        done(err)
      })
    })
  })
  describe('checkBlockchain', function () {
    it('should check blockchain and return an updated db record', function (done) {
      checkBlockchain(service, proxycoreService)('BTC').then(result => {
        assert.equal(result, fixtureDB.data[0])
        done()
      }).catch(err => {
        console.log(`*** error test: `, err)
      })
    })
    it('should check blockchain and return true when NO change detected', function (done) {
      const service = {
        patch: () => Promise.resolve(fixtureDB.data[0]),
        find: () => Promise.resolve({
          'total': 1,
          'data': [
            {
              '_id': '5aba92a302fb78d9a969bd93',
              'coinType': 'BTC',
              'status': true,
              'mode': 'regtest',
              'createdAt': '2018-03-27T18:51:15.691Z',
              'updatedAt': '2018-03-28T19:09:23.899Z',
              '__v': 0,
              'difficulty': 4.656542373906925e-10,
              'bestblockhash': '1962811fcbe887ad37049cc33bf635e3e3ba6a955aacd5edd436ba708c552445',
              'currentBlockHeight': 1271,
              'mediantime': 1521682385,
              'errorMessage': ''
            }
          ]
        }
        )
      }
      checkBlockchain(service, proxycoreService)('BTC').then(result => {
        assert.equal(result, true)
        done()
      }).catch(err => {
        console.log(`*** error test: `, err)
      })
    })
  })
})
