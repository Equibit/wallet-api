const assert = require('assert')
const {
  Service
} = require('./listunspent.class')
const { transactions } = require('../../../test-utils/index')
const app = require('../../app')

const singleTimeoutConfig = {
  app: {
    get: key => {
      switch (key) {
        case 'btcImportTimeout':
          return 5000
        case 'eqbImportTimeout':
          return 0
        case 'btcRetrieveTimeout':
          return 5000
        case 'eqbRetrieveTimeout':
          return 0
        default:
          return app.get(key)
      }
    },
    service: key => app.service(key)
  }
}

const doubleTimeoutConfig = {
  app: {
    get: key => {
      switch (key) {
        case 'btcImportTimeout':
          return 0
        case 'eqbImportTimeout':
          return 0
        case 'btcRetrieveTimeout':
          return 0
        case 'eqbRetrieveTimeout':
          return 0
        default:
          return app.get(key)
      }
    },
    service: key => app.service(key)
  }
}

const query = { doImport: false,
  btc: [
    'someBitcoinAddress'
  ],
  eqb:
  [
    'someEquibitAddress'
  ],
  byaddress: true
}

describe('listunspent', () => {
  describe('find', function () {
    beforeEach(function () {
      transactions.setupMock()
    })
    afterEach(function () {
      transactions.resetMock()
    })
    it('should retrieve btc and eqb totals', () => {
      const theService = new Service({ app })
      return theService.find({ query }).then(result => {
        assert(result.BTC)
        assert(result.EQB)
      })
    })
    it('return btc when eqb calls time out', () => {
      const theService = new Service(singleTimeoutConfig)
      return theService.find({ query }).then(
        result => {
          assert(result.BTC)
          assert(!result.EQB)
        }
      )
    })
    it('should fail when btc and eqb both time out', () => {
      const theService = new Service(doubleTimeoutConfig)
      return theService.find({ query }).then(
        () => {
          assert.fail()
        },
        err => {
          assert.equal(err.message, 'timed out')
        }
      )
    })
  })
})
