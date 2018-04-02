const assert = require('assert')
const updateOfferExpiration = require('./hook.update-offer-expiration')

describe('Transactions Service - updateOfferExpiration Hook', function () {
  let findCalled
  let offerPatchData
  function setupOfferService (data) {
    findCalled = false
    offerPatchData = null
    return function () {
      return {
        find (params) {
          // console.log(`find`, params)
          findCalled = true
          return Promise.resolve(data)
        },
        patch (id, data) {
          // console.log(`patch`, data)
          offerPatchData = data
          return Promise.resolve(data)
        }
      }
    }
  }

  it('updates offer record with htlc1', function (done) {
    const hook = {
      app: { service: setupOfferService([{
        htlcTxId1: 'abc',
        timelock: 144
      }]) },
      result: {
        txId: 'abc',
        htlcStep: 1,
        confirmationBlockHeight: 100
      }
    }
    updateOfferExpiration()(hook).then(() => {
      assert.ok(findCalled)
      assert.equal(offerPatchData.timelock1ExpiresBlockheight, 244)
      done()
    })
  })

  it('updates offer record with htlc2', function (done) {
    const hook = {
      app: { service: setupOfferService([{
        htlcTxId2: 'abc',
        timelock2: 144
      }]) },
      result: {
        txId: 'abc',
        htlcStep: 2,
        confirmationBlockHeight: 100
      }
    }

    updateOfferExpiration()(hook).then(() => {
      assert.ok(findCalled)
      assert.equal(offerPatchData.timelock2ExpiresBlockheight, 244)
      done()
    })
  })

  it('does not update record if no offer found', function (done) {
    const hook = {
      app: { service: setupOfferService([]) },
      result: {
        txId: 'abc',
        htlcStep: 2,
        confirmationBlockHeight: 100
      }
    }

    updateOfferExpiration()(hook).then(() => {
      assert.ok(findCalled)
      assert.ok(!offerPatchData)
      done()
    })
  })

  it('skips hook if no blockheight set', function () {
    const hook = {
      app: { service: setupOfferService([]) },
      result: {
        txId: 'abc',
        htlcStep: 2
      }
    }

    const result = updateOfferExpiration()(hook)
    assert.equal(result, hook)
    assert.ok(!findCalled)
    assert.ok(!offerPatchData)
  })

  it('skips hook if its not htlc 1 or 2', function () {
    const hook = {
      app: { service: setupOfferService([]) },
      result: {
        txId: 'abc',
        htlcStep: 3
      }
    }

    const result = updateOfferExpiration()(hook)
    assert.equal(result, hook)
    assert.ok(!findCalled)
    assert.ok(!offerPatchData)
  })
})
