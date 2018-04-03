const assert = require('assert')
// const feathers = require('feathers')
const feathers = require('@feathersjs/feathers');
const memory = require('feathers-memory');
const offers = require('../../offers/offers.service.js')
const updateOfferExpiration = require('./hook.update-offer-expiration')

const options = {
  id: '_id',
  paginate: {
    default: 10,
    max: 25
  }
}

describe('Transactions Service - updateOfferExpiration Hook', function () {
  let app
  beforeEach(() => {
    app = feathers()
    app.use('/offers', memory(options))
    app.use('/transactions', memory(options))
    app.service('transactions').hooks({
      after: {
        patch: [
          hook => {
            // console.log('TX HOOK after patch', hook.result)
            return hook
          },
          updateOfferExpiration()]
      }
    })
    app.service('offers').create({
      _id: 1,
      htlcTxId1: 'abc',
      timelock: 144
    })
    app.service('transactions').create(
      {_id: 1, htlcStep: 1, txId: 'abc'}
    )
    app.service('transactions').create(
      {_id: 2, htlcStep: 2, txId: 'def'}
    )
  })
  it('should patch offer with the correct value', function (done) {
    app.service('offers').hooks({
      before: {
        patch: hook => {
          assert.equal(hook.data.timelockExpiresBlockheight, 244)
          done()
          return hook
        }
      }
    })
    app.service('transactions').patch(1, {confirmationBlockHeight: 100}).then(result => {
      assert.equal(result.confirmationBlockHeight, 100)
    })
  })
  //TODO: enable this after upgrading the hook to work with an array of results (e.g. when a patch with query is used: service.patch(null, {}, {query: { txId: { $in: ['abc', 'def'] }}))
  // it('should patch offer after updating multiple transactions', function (done) {
  //   let offerPatchCalled = 0
  //   app.service('offers').hooks({
  //     before: {
  //       patch: hook => {
  //         offerPatchCalled++
  //         assert.equal(hook.data.timelockExpiresBlockheight, 244)
  //         if (offerPatchCalled === 2) {
  //           assert.equal(offerPatchCalled, 2)
  //           done()
  //         }
  //         return hook
  //       }
  //     }
  //   })
  //   app.service('transactions').patch(null, {confirmationBlockHeight: 100}, {
  //     query: { txId: { $in: ['abc', 'def'] } }
  //   }).then(result => {
  //     assert.equal(result.length, 2)
  //     assert.equal(result[0].confirmationBlockHeight, 100)
  //     assert.equal(result[1].confirmationBlockHeight, 100)
  //   })
  // })
})
