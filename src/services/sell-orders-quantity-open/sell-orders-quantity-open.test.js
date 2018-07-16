const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const { clients, transactions } = require('../../../test-utils/index')
const userUtils = require('../../../test-utils/users')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')

const servicePath = 'sell-orders-quantity-open'
const serviceOnServer = app.service(servicePath)

const skels = {
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
  })
}

describe(`${servicePath} Service`, function () {
  clients.forEach(client => {
    runTests(client)
  })

  describe(`${servicePath} - Server`, () => {
    it('registered the service', () => {
      assert.ok(serviceOnServer, 'Registered the service')
    })

    describe.skip('Find', function () {})
    describe.skip('Get', function () {})
    describe.skip('Create', function () {})
    describe.skip('Update', function () {})
    describe.skip('Patch', function () {})
    describe.skip('Remove', function () {})
  })
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('sell-orders-quantity-open')

  describe(`${servicePath} - ${transport} Transport`, function () {
    before(function () {
      return userUtils.removeAll(app)
    })

    beforeEach(function (done) {
      userUtils.create(app)
      .then(user => {
        this.user = user
        done()
      })
    })

    afterEach(function (done) {
      feathersClient.logout()
        .then(() => userUtils.removeAll(app))
        .then(() => done())
    })

    describe('Client Unauthenticated', function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          assertRequiresAuth(serviceOnClient, method)
        })
      })
    })

    describe(`${servicePath} - Authenticated Client`, function () {
      beforeEach(function () {
        transactions.setupMock()
      })
      afterEach(function () {
        transactions.resetMock()
      })
      it('reports the correct sellOrdersQuantityOpen', function (done) {
        const user = this.user
        const ordersService = app.service('orders')
        const offersService = app.service('offers')
        const query = { assetType: 'ISSUANCE', issuanceId: '000000000000000000000000' }

        userUtils.authenticateTemp(app, feathersClient, user)
          .then(() => {
            return serviceOnClient.find({ query })
          })
          .then(response => {
            assert(response && response.data, 'got a response')
            assert.equal(response.data.sellOrdersQuantityOpen, 0, 'amount is correctly 0')
            const orderCreateData = Object.assign({}, skels.sellOrder, {
              userId: user._id.toString(),
              quantity: 1000
            })
            return ordersService.create(orderCreateData)
          })
          .then(order => {
            assert(order, 'order created')
            const offerCreateData = Object.assign({}, skels.buyOffer, {
              userId: user._id.toString(),
              quantity: 250,
              status: 'CLOSED',
              orderId: order._id.toString()
            })
            return offersService.create(offerCreateData)
          })
          .then(offer => {
            assert(offer, 'offer created')
            return serviceOnClient.find({ query })
          })
          .then(response => {
            assert(response && response.data, 'got a response')
            assert.equal(response.data.sellOrdersQuantityOpen, 750, 'amount is correct: 750')
            const orderCreateData = Object.assign({}, skels.sellOrder, {
              userId: user._id.toString(),
              quantity: 75
            })
            return ordersService.create(orderCreateData)
          })
          .then(order => {
            assert(order, 'order 2 created')
            const offerCreateData = Object.assign({}, skels.buyOffer, {
              userId: user._id.toString(),
              quantity: 70, // doesn't matter for this because status is OPEN
              status: 'OPEN',
              orderId: order._id.toString()
            })
            return offersService.create(offerCreateData)
          })
          .then(offer => {
            assert(offer, 'offer 2 created')
            return serviceOnClient.find({ query })
          })
          .then(response => {
            assert(response && response.data, 'got a response')
            assert.equal(response.data.sellOrdersQuantityOpen, 825, 'amount is correct: 825')
          })
          .catch(error => {
            console.log('ERROR ', error)
            assert(!error, 'this error should not have occurred')
            done()
          })
          .then(() => {
            ordersService.remove(null, { query: { userId: this.user._id.toString() } })
            done()
          })
      })
    })
  })
}
