const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')
const userUtils = utils.users

utils.clients.forEach(client => {
  runTests(client)
})

const skels = {
  sellOffer: Object.freeze({
    userId: '000000000000000000000000',
    type: 'SELL',
    status: 'OPEN',
    htlcStep: 1,
    quantity: 10,
    price: 333,
    issuanceId: '000000000000000000000000',
    issuanceAddress: '000000000000000000000000',
    hashlock: '000000000000000000000000',
    timelock: 1234,
    btcAddress: '000000000000000000000000',
    eqbAddress: '000000000000000000000000'
  }),
  buyOffer: Object.freeze({
    userId: '000000000000000000000000',
    type: 'BUY',
    status: 'OPEN',
    htlcStep: 1,
    quantity: 10,
    price: 333,
    issuanceId: '000000000000000000000000',
    issuanceAddress: '000000000000000000000000',
    hashlock: '000000000000000000000000',
    timelock: 1234,
    btcAddress: '000000000000000000000000',
    eqbAddress: '000000000000000000000000'
  }),
  sellOrder: Object.freeze({
    userId: '000000000000000000000000',
    issuanceId: '000000000000000000000000',
    issuanceAddress: '000000000000000000000000',
    type: 'SELL',
    portfolioId: '000000000000000000000000',
    quantity: 60,
    price: 10,
    status: 'OPEN',
    isFillOrKill: false,
    goodFor: 7,
    companyName: 'Foo',
    issuanceName: 'Bar',
    issuanceType: 'bonds'
  }),
  buyOrder: Object.freeze({
    userId: '000000000000000000000000',
    issuanceId: '000000000000000000000000',
    issuanceAddress: '000000000000000000000000',
    type: 'BUY',
    portfolioId: '000000000000000000000000',
    quantity: 60,
    price: 10,
    status: 'OPEN',
    isFillOrKill: false,
    goodFor: 7,
    companyName: 'Foo',
    issuanceName: 'Bar',
    issuanceType: 'bonds'
  })
}

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('orders')
  const serviceOnServer = app.service('orders')
  const offersServiceOnServer = app.service('offers')

  describe(`Orders Service Tests - ${transport}`, function () {
    before(function () {
      return userUtils.removeAll(app)
    })

    describe('Client Without Auth', function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          assertRequiresAuth(serviceOnClient, method)
        })
      })
    })

    describe('Client With Auth', function () {
      beforeEach(function (done) {
        userUtils.create(app).then(user => {
          this.user = user
          done()
        })
      })

      afterEach(function (done) {
        feathersClient.logout()
          .then(() => serviceOnServer.remove(null, { query: { userId: '000000000000000000000000' } }))
          .then(() => userUtils.removeAll(app))
          .then(() => done())
      })

      it('can create order and cancel it', function (done) {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString()
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return serviceOnClient.create(createData)
        })
        .then(order => {
          assert.equal(order.status, 'OPEN')
          return serviceOnClient.patch(order._id.toString(), { status: 'CANCELLED' })
        })
        .then(order => {
          assert.equal(order.status, 'CANCELLED')
          done()
        })
        .catch(done)
      })

      it('cannot cancel an order that is TRADING', function (done) {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString()
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return serviceOnClient.create(createData)
        })
        .then(order => {
          assert.equal(order.status, 'OPEN')
          return serviceOnClient.patch(order._id.toString(), { status: 'TRADING' })
        })
        .then(order => {
          assert.equal(order.status, 'TRADING')
          return serviceOnClient.patch(order._id.toString(), { status: 'CANCELLED' })
        })
        .then(order => {
          done('should not be able to cancel order')
        })
        .catch(err => {
          try {
            assert.equal(err.message, 'Order cannot be cancelled unless it is open.', err.message)
            done()
          } catch (err) {
            done(err)
          }
        })
      })

      it('can cancel an order that has offers', function (done) {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString()
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return serviceOnClient.create(createData)
        })
        .then(order => {
          assert.equal(order.status, 'OPEN')
          const offerData = Object.assign({}, skels.sellOffer, {
            orderId: order._id.toString(),
            isAccepted: false
          })
          return offersServiceOnServer.create(offerData)
            .then(offer => {
              assert.equal(offer.isAccepted, false)
              return order
            })
        })
        .then(order => {
          return serviceOnClient.patch(order._id.toString(), { status: 'CANCELLED' })
        })
        .then(order => {
          assert.equal(order.status, 'CANCELLED')
          done()
        })
        .catch(done)
      })

      it('cannot cancel an order that has accepted offers', function (done) {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString()
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return serviceOnClient.create(createData)
        })
        .then(order => {
          assert.equal(order.status, 'OPEN')
          const offerData = Object.assign({}, skels.sellOffer, {
            orderId: order._id.toString(),
            isAccepted: true
          })
          return offersServiceOnServer.create(offerData)
            .then(offer => {
              assert.equal(offer.isAccepted, true)
              return order
            })
        })
        .then(order => {
          return serviceOnClient.patch(order._id.toString(), { status: 'CANCELLED' })
        })
        .then(order => {
          done('should not be able to cancel order')
        })
        .catch(err => {
          try {
            assert.equal(err.message, 'Order cannot be cancelled after an offer has been accepted.', err.message)
            done()
          } catch (err) {
            done(err)
          }
        })
      })
    })
  })
}
