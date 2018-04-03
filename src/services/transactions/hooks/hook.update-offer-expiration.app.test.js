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
        patch: updateOfferExpiration()
      }
    })
    app.service('offers').create({
      _id: 1,
      htlcTxId1: 'abc',
      timelock: 144
    })
    app.service('transactions').create(
      {_id: 1, htlcStep: 1, txId: 'abc'},
      {_id: 2, htlcStep: 2, txId: 'abc'}
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
})
