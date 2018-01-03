const assert = require('assert')
const {
  // aggregateByAddress,
  // addSummary,
  resultToSatoshi
} = require('./listunspent-utils')
const fixtures = require('./fixtures.json')

describe('listunspent-utils', () => {
  describe('resultToSatoshi', function () {
    it('should convert bitcoins to satoshi', () => {
      const resultsInSatoshi = resultToSatoshi(fixtures.result)
      assert.equal(resultsInSatoshi[0].amount, 625000000)
      assert.equal(resultsInSatoshi[1].amount, 2500000000)
      assert.equal(resultsInSatoshi[2].amount, 1250000000)
    })
    it('should handle empty result', () => {
      const resultsInSatoshi = resultToSatoshi([])
      assert.equal(resultsInSatoshi.length, 0)
    })
  })
})
