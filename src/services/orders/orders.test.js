const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')
const userUtils = utils.users

utils.clients.forEach(client => {
  runTests(client)
})

const SATOSHI = 100000000

const skels = {
  sellOffer: Object.freeze({
    userId: '000000000000000000000000',
    type: 'SELL',
    status: 'OPEN',
    htlcStep: 1,
    quantity: 10 * SATOSHI,
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
    quantity: 10 * SATOSHI,
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
    quantity: 60 * SATOSHI,
    price: 1000,
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
    quantity: 60 * SATOSHI,
    price: 1000,
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
      // 'find', 'get' don't require auth - Order Book is public for viewing.
      const methods = ['create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          assertRequiresAuth(serviceOnClient, method)
        })
      })

      it('can get all orders without userId field', function (done) {
        serviceOnClient.find()
        .then(orders => {
          orders.data.forEach(order => assert.ok(!('userId' in orders)))
          done()
        })
        .catch(done)
      })

      it('cannot create an order', function (done) {
        const createData = Object.assign({}, skels.sellOrder)
        serviceOnClient.create(createData)
        .then(() => done('order should not be created'))
        .catch((err) => {
          assert.equal(err.name, 'NotAuthenticated')
          done()
        })
      })

      it('cannot update an order', function (done) {
        let data = {}
        const createData = Object.assign({}, skels.sellOrder)
        userUtils.create(app)
        .then(user => {
          this.user = user
          userUtils.authenticateTemp(app, feathersClient, user)
        })
        .then(loggedInResponse => serviceOnClient.create(createData))
        .then(order => {
          data = order
          return feathersClient.logout()
        })
        .then(() => serviceOnClient.patch(data._id.toString(), { status: 'CANCELLED' }))
        .then(() => {
          done('order should not be patched')
        })
        .catch((err) => {
          assert.equal(err.name, 'NotAuthenticated')
          return serviceOnServer.remove(null, { query: { userId: this.user._id.toString() } })
        })
        .then(() => {
          userUtils.removeAll(app)
          done()
        })
        .catch(done)
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
          .then(() => serviceOnServer.remove(null, { query: { userId: this.user._id.toString() } }))
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

      it('cannot create an order with restricted fields', function (done) {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString(),
          btcAddress: '123123123',
          eqbAddress: '123123123',
          status: 'CLOSED',
          issuanceName: 'TEST',
          issuanceType: 'ISSUANCE',
          companyName: 'TEST'
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => serviceOnClient.create(createData))
        .then(order => {
          Object.keys(order).forEach(key => assert.ok(key in order))
          done()
        })
        .catch(done)
      })

      it('cannot create an order with a very small quantity', function () {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString(),
          quantity: 1
        })
        return userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(() => serviceOnClient.create(createData))
        .then(
          () => Promise.reject(new Error('should have failed')),
          () => Promise.resolve('failed correctly')
        )
      })

      it.only('cannot create an order with a very small quantity', function () {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString(),
          quantity: 100000000,
          price: 1000
        })
        return userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(() => serviceOnClient.create(createData))
        .then(
          () => Promise.reject(new Error('should have failed')),
          () => Promise.resolve('failed correctly')
        )
      })

      it('cannot see the userId that does not belong to the user', function (done) {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString()
        })

        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => serviceOnClient.create(createData))
        .then(order => feathersClient.logout())
        .then(() => app.service('/users').create({ email: userUtils.testEmails[1] }))
        .then(user => app.service('users').find({ query: { email: userUtils.testEmails[1] } }))
        .then(users => {
          users = users.data || users
          return userUtils.authenticateTemp(app, feathersClient, users[0])
        })
        .then(loggedInResponse => serviceOnClient.find())
        .then(orders => {
          const myOrders = orders.data.filter(order => 'userId' in order)
          assert.equal(myOrders.length, 0)
          done()
        }).catch(done)
      })

      it('cannot remove an order', function (done) {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString()
        })

        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => serviceOnClient.create(createData))
        .then(order => {
          this.id = order._id
          serviceOnClient.remove(null, { query: { userId: this.user._id.toString() } })
        })
        .then(() => serviceOnClient.get(this.id))
        .then(order => {
          assert.ok(order)
          done()
        })
      })

      it('can see the userId that belongs to the user', function (done) {
        const createData = Object.assign({}, skels.sellOrder, {
          userId: this.user._id.toString()
        })

        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(() => serviceOnClient.create(createData))
        // we query only for our own orders because there are too many orders
        // we were not guaranteed to find one of our own
        .then(() => serviceOnClient.find({ query: { userId: this.user._id.toString() } }))
        .then(orders => {
          assert.equal(orders.data.length, 1)
          assert(orders.data.every(order => 'userId' in order))
          done()
        }).catch(done)
      })

      it('cannot update an order with restricted fields', function (done) {
        const createData = Object.assign({}, skels.buyOrder, {
          userId: this.user._id.toString()
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => serviceOnClient.create(createData))
        .then(order => serviceOnClient.patch(order._id.toString(), { price: 0 }))
        .then(order => {
          assert.equal(order.price, 1000)
          done()
        }).catch(done)
      })

      describe('that is a non-owner', function () {
        it('cannot update an order that does not belong to them', function (done) {
          const createData = Object.assign({}, skels.buyOrder, {
            userId: this.user._id.toString()
          })

          userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => serviceOnClient.create(createData))
          .then(order => {
            this.order = order
            feathersClient.logout()
          })
          .then(() => app.service('/users').create({ email: userUtils.testEmails[1] }))
          .then(user => app.service('users').find({ query: { email: userUtils.testEmails[1] } }))
          .then(users => {
            users = users.data || users
            return userUtils.authenticateTemp(app, feathersClient, users[0])
          })
          .then(loggedInResponse => serviceOnClient.patch(this.order._id.toString(), { status: 'CANCELLED' }))
          .then(() => {
            done('order should not be patched')
          })
          .catch(err => {
            try {
              assert.equal(err.name, 'Forbidden')
              done()
            } catch (err) {
              done(err)
            }
          })
        })
      })
    })
  })
}
