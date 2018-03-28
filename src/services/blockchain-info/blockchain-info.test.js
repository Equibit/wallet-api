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
  updateDB
} = blockchainInfoService

describe('\'blockchain-info\' service', () => {
  const fixtureNormalized = {
    mode: 'regtest',
    status: true,
    currentBlockHeight: 1271,
    bestblockhash: '1962811fcbe887ad37049cc33bf635e3e3ba6a955aacd5edd436ba708c552445',
    difficulty: 4.656542373906925e-10,
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
