const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const { users: userUtils, transactions: txUtils } = utils
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')
const assertAuthNotRequired = require('../../../test-utils/assert/auth-not-required')
// const offerUtils = require('../../../test-utils/offers')

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
    issuanceType: 'bonds',
    btcAddress: '000000000000000000000000',
    eqbAddress: '000000000000000000000000'
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
    issuanceType: 'bonds',
    btcAddress: '000000000000000000000000',
    eqbAddress: '000000000000000000000000'
  }),
  issuance: Object.freeze({
    userId: '000000000000000000000000',
    index: 0,
    companyIndex: 0,
    issuanceTxId: '000000000000000000000000',
    issuanceAddress: '000000000000000000000000',
    companyId: '000000000000000000000000',
    companyName: '000000000000000000000000',
    companySlug: '000000000000000000000000',
    domicile: '000000000000000000000000',
    issuanceName: '000000000000000000000000',
    issuanceType: '000000000000000000000000',
    sharesIssued: 0,
    sharesAuthorized: 10000
  })
}

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('offers')
  const serviceOnServer = app.service('offers')

  const ordersServiceOnServer = app.service('orders')
  const issuanceServiceOnServer = app.service('issuances')

  // socketio has trouble with switching accounts
  const restOnly = feathersClient.io ? it.skip : it

  describe(`Offers Service Tests - ${transport}`, function () {
    before(function () {
      return userUtils.removeAll(app)
    })

    describe('Client Unauthenticated', function () {
      const authMethods = ['create', 'update', 'patch', 'remove']
      const noAuthMethods = ['get', 'find']

      authMethods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          return assertRequiresAuth(serviceOnClient, method)
        })
      })
      noAuthMethods.forEach(method => {
        it(`does not require auth on ${method}`, function () {
          return assertAuthNotRequired(serviceOnClient, method)
        })
      })
      it('removes all userIds for an unauthenticated request', () => {
        return serviceOnClient.find([{}]).then(result => {
          return assert(!result.data.some(offer => offer.userId))
        })
      })
    })

    describe('Real-time notfications with Auth', function () {
      before(function () {
        return userUtils.removeAll(app)
          .then(() => utils.users.create(app))
          .then(user => {
            return utils.users.authenticate(app, feathersClient, user)
              // Get the matching socketId for the authenticated user
              .then(res => {
                if (transport === 'feathers-socketio') {
                  const socketId = Object.keys(app.io.sockets.sockets).reduce((acc, socketId) => {
                    let socketFeathers = app.io.sockets.sockets[socketId].feathers
                    if (!acc && socketFeathers.user && socketFeathers.user._id && user._id &&
                      socketFeathers.user._id.toString() === user._id.toString()
                    ) {
                      acc = socketId
                    }
                    return acc
                  }, null)
                  app.io.sockets.sockets[socketId].feathers.addresses = ['test-address']
                }
              })
          })
          .then(() => {
            return ordersServiceOnServer.create(skels.sellOrder).then(order => {
              this.order = order
            })
          })
      })

      after(function () {
        return feathersClient.logout()
          .then(() => userUtils.removeAll(app))
          .then(() => ordersServiceOnServer.remove(null, { query: { userId: '000000000000000000000000' } }))
          .then(() => serviceOnServer.remove(null, { query: { userId: '000000000000000000000000' } }))
      })

      if (transport === 'feathers-socketio') {
        it('Sends a real-time update', function (done) {
          const offerData = Object.assign({}, skels.buyOffer, {
            orderId: this.order._id.toString(),

            // Issuance info:
            companyName: 'Test',
            issuanceName: 'Test',
            issuanceType: 'Stock',
            issuanceAddress: '12345',

            // EQB address to receive securities to for a BUY offer
            // eqbAddress: 'string',
            // BTC address to receive payment to for a SELL offer
            btcAddress: 'test-address',

            // HTLC:
            eqbAddress: 'some-address'
          })

          const checkOffer = function checkOffer (offer) {
            assert(offer, 'should receive offer in the event')
            done()
          }

          // serviceOnClient.once('created', checkOffer)

          serviceOnClient.create(offerData)
            .then(checkOffer, done)
        })
      }
    })

    describe('With Auth', function () {
      beforeEach(function (done) {
        userUtils.create(app, 1).then(user => {
          this.orderUser = user
          return userUtils.authenticateTemp(
            app, feathersClient, this.orderUser
          ).then(() => {
            const skel = { ...skels.buyOrder }
            skel.userId = user._id
            return ordersServiceOnServer.create(skel)
          })
        }).then(order => {
          this.order = order
        }).then(() =>
          userUtils.create(app, 0).then(user => {
            this.user = user
            done()
          })
        )
      })
      const auth = user => {
        return promiseResult =>
          userUtils.authenticateTemp(app, feathersClient, user).then(() => promiseResult)
      }
      afterEach(function (done) {
        feathersClient.logout()
          .then(() => serviceOnServer.remove(null, { query: { userId: '000000000000000000000000' } }))
          .then(() => ordersServiceOnServer.remove(null, { query: { userId: '000000000000000000000000' } }))
          .then(() => userUtils.removeAll(app))
          .then(() => txUtils.removeAll(app))
          .then(() => done())
      })

      it('sets offer.status automatically - normal flow and some edge cases', function (done) {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString()

        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return serviceOnClient.create(createData)
        })
        .then(offer => {
          assert.equal(offer.status, 'OPEN')
          return serviceOnClient.patch(offer._id.toString(), { htlcStep: 1 })
        })
        .then(offer => {
          assert.equal(offer.status, 'OPEN')
          return serviceOnClient.patch(offer._id.toString(), { status: 'TRADING' })
        })
        .then(offer => {
          assert.equal(offer.status, 'OPEN', 'status cannot be changed to TRADING manually')
          return serviceOnClient.patch(offer._id.toString(), { htlcStep: 2 })
        })
        .then(offer => {
          assert.equal(offer.status, 'TRADING')
          return serviceOnClient.patch(offer._id.toString(), { htlcStep: 3, status: 'CLOSED' })
        })
        .then(offer => {
          assert.equal(offer.status, 'TRADING', 'status cannot be changed to CLOSED manually')
          return serviceOnClient.patch(offer._id.toString(), { status: 'OPEN' })
        })
        .then(offer => {
          assert.equal(offer.status, 'TRADING', 'status cannot be changed to OPEN manually')
          return serviceOnClient.patch(offer._id.toString(), { htlcStep: 4 })
        })
        .then(offer => {
          assert.equal(offer.status, 'CLOSED')
          return serviceOnClient.patch(offer._id.toString(), { status: 'CANCELLED' })
        })
        .catch(err => {
          try {
            assert.equal(err.message, 'Offer cannot be modified once CLOSED or CANCELLED.', err.message)
            done()
          } catch (assertionErr) {
            done(assertionErr)
          }
        })
      })

      it.only('cannot make a very small offer', function () {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          quantity: 1
        })
        return userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return serviceOnClient.create(createData)
        })
        .then(
          () => Promise.reject(new Error('should have failed')),
          () => Promise.resolve('failed correctly')
        )
      })

      it('cannot make an offer that is nearly all the order', function () {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          quantity: this.order.quantity - 50
        })
        return userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return serviceOnClient.create(createData)
        })
        .then(
          () => Promise.reject(new Error('should have failed')),
          () => Promise.resolve('failed correctly')
        )
      })

      it('can make an offer that is exactly all the order', function () {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          quantity: this.order.quantity
        })
        return userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return serviceOnClient.create(createData)
        })
      })

      restOnly('offer.status can be set to CANCELLED while OPEN - and cannot be changed after except in limited circumstances', function (done) {
        let txObj
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString()
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return app.service('transactions').create({
            fromAddress: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
            addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
            addressVout: 0,
            type: 'TRADE',
            currencyType: 'BTC',
            toAddress: '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z',
            amount: 777123,
            fee: 0.0001,
            hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
          })
        })
        .then(tx => {
          txObj = tx
          return serviceOnClient.create(createData)
        })
        .then(
          auth(this.orderUser)
        )
        .then(offer => {
          assert.equal(offer.status, 'OPEN')
          return serviceOnClient.patch(offer._id.toString(), { htlcStep: 2 })
        })
        .then(
          auth(this.user)
        )
        .then(offer => {
          return serviceOnClient.patch(offer._id.toString(), {
            status: 'CANCELLED',
            htlcStep: 3,
            htlcTxId3: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba'
          })
        })
        .then(
          auth(this.orderUser)
        )
        .then(offer => {
          assert.equal(offer.status, 'CANCELLED', 'offer was cancelled')
          return serviceOnClient.patch(offer._id.toString(), {
            htlcStep: 4,
            htlcTxId4: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba'
          })
        })
        .then(
          auth(this.user)
        )
        .then(offer => {
          assert.equal(offer.htlcStep, 4, 'offer htlcStep was updated')
          assert.equal(offer.htlcTxId4, '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba', 'offer htlcTxId4 was updated')
          return serviceOnClient.patch(offer._id.toString(), {
            status: 'CLOSED'
          })
        })
        .then(() => done('should not have succeeded'), err => {
          try {
            assert.equal(err.message, 'Offer cannot be modified once CLOSED or CANCELLED.', err.message)

            done()
          } catch (assertionErr) {
            done(assertionErr)
          }
          txObj && app.service('transactions').remove(txObj._id)
        })
      })

      it('offer.status can be set to CANCELLED while TRADING', function (done) {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString()
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            serviceOnClient.create(createData)
              .then(offer => {
                assert.equal(offer.status, 'OPEN')
                return serviceOnClient.patch(offer._id.toString(), { htlcStep: 1 })
              })
              .then(offer => {
                assert.equal(offer.status, 'OPEN')
                return serviceOnClient.patch(offer._id.toString(), { htlcStep: 2 })
              })
              .then(offer => {
                assert.equal(offer.status, 'TRADING')
                return serviceOnClient.patch(offer._id.toString(), { status: 'CANCELLED' })
              })
              .then(offer => {
                assert.equal(offer.status, 'CANCELLED', 'offer was cancelled')
                done()
              })
              .catch(done)
          })
      })

      it('closes a fill or kill offer once it is accepted', function (done) {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          htlcStep: 3,
          status: 'TRADING'
        })
        let createdId
        ordersServiceOnServer.patch(this.order._id.toString(), {
          isFillOrKill: true
        }).then(() =>
          serviceOnServer.create(createData).then(offer => {
            createdId = offer._id.toString()
          })
        ).then(() =>
          userUtils.authenticateTemp(app, feathersClient, this.orderUser)
        ).then(() =>
          serviceOnClient.patch(createdId, { htlcStep: 4, isAccepted: true })
        )
        .then(() =>
          ordersServiceOnServer.get(this.order._id)
        )
        .then(order => {
          assert.equal(order.status, 'CLOSED')
        })
        .then(done, err => done(err))
      })

      it('change order status back to OPEN if offer is expired for fill or kill order', function (done) {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          htlcStep: 2,
          status: 'TRADING'
        })
        let createdId
        ordersServiceOnServer.patch(this.order._id.toString(), {
          isFillOrKill: true
        }).then(() =>
          serviceOnServer.create(createData).then(offer => {
            createdId = offer._id.toString()
          })
        ).then(() =>
          userUtils.authenticateTemp(app, feathersClient, this.orderUser)
        ).then(() =>
          serviceOnClient.patch(createdId, { htlcStep: 3, timelockExpiredAt: Date.now() })
        )
        .then(() =>
          ordersServiceOnServer.get(this.order._id)
        )
        .then(order => {
          assert.equal(order.status, 'OPEN')
        })
        .then(done, err => done(err))
      })

      it('change order status back to OPEN if offer gets refunded for fill or kill order', function (done) {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          htlcStep: 2,
          status: 'TRADING'
        })
        let createdId
        ordersServiceOnServer.patch(this.order._id.toString(), {
          isFillOrKill: true
        }).then(() =>
          serviceOnServer.create(createData).then(offer => {
            createdId = offer._id.toString()
          })
        ).then(() =>
          userUtils.authenticateTemp(app, feathersClient, this.orderUser)
        ).then(() =>
          serviceOnClient.patch(createdId, { htlcStep: 3, status: 'CLOSED' })
        )
        .then(() =>
          ordersServiceOnServer.get(this.order._id)
        )
        .then(order => {
          assert.equal(order.status, 'OPEN')
        })
        .then(done, err => done(err))
      })

      it('change order status to TRADING once offer gets accepted', function (done) {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          htlcStep: 1,
          status: 'OPEN'

        })
        let createdId
        serviceOnServer.create(createData).then(offer => {
          createdId = offer._id.toString()
        })
        .then(() =>
          userUtils.authenticateTemp(app, feathersClient, this.orderUser)
        ).then(() =>
          serviceOnClient.patch(createdId, { htlcStep: 2, isAccepted: true })
        )
        .then(() =>
          ordersServiceOnServer.get(this.order._id)
        )
        .then(order => {
          assert.equal(order.status, 'TRADING')
        })
        .then(done, err => done(err))
      })

      it('change partial order status to CLOSED once quantities are fully filled', function (done) {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          htlcStep: 3,
          status: 'TRADING',
          quantity: 20
        })
        let createdId1, createdId2, createdId3
        ordersServiceOnServer.patch(this.order._id.toString(), {
          isFillOrKill: true
        }).then(() =>
          Promise.all([
            serviceOnServer.create(createData).then(offer => { createdId1 = offer._id.toString() }),
            serviceOnServer.create(createData).then(offer => { createdId2 = offer._id.toString() }),
            serviceOnServer.create(createData).then(offer => { createdId3 = offer._id.toString() })
          ])
        ).then(() =>
          userUtils.authenticateTemp(app, feathersClient, this.orderUser)
        ).then(() =>
          Promise.all([
            serviceOnClient.patch(createdId1, { htlcStep: 4, isAccepted: true }),
            serviceOnClient.patch(createdId2, { htlcStep: 4, isAccepted: true }),
            serviceOnClient.patch(createdId3, { htlcStep: 4, isAccepted: true })
          ])
        )
        .then(() =>
          ordersServiceOnServer.get(this.order._id)
        )
        .then(order => {
          assert.equal(order.status, 'CLOSED')
        })
        .then(done, err => done(err))
      })

      it('cannot accept an offer which would nearly complete the order', function () {
        const createData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          htlcStep: 3,
          status: 'TRADING',
          quantity: (this.order.quantity / 3) - 2
        })
        let createdId1, createdId2, createdId3
        ordersServiceOnServer.patch(this.order._id.toString(), {
          isFillOrKill: true
        }).then(() =>
          Promise.all([
            serviceOnServer.create(createData).then(offer => { createdId1 = offer._id.toString() }),
            serviceOnServer.create(createData).then(offer => { createdId2 = offer._id.toString() }),
            serviceOnServer.create(createData).then(offer => { createdId3 = offer._id.toString() })
          ])
        ).then(() =>
          userUtils.authenticateTemp(app, feathersClient, this.orderUser)
        ).then(() =>
          Promise.all([
            serviceOnClient.patch(createdId1, { htlcStep: 4, isAccepted: true }),
            serviceOnClient.patch(createdId2, { htlcStep: 4, isAccepted: true }),
            serviceOnClient.patch(createdId3, { htlcStep: 4, isAccepted: true })
          ]).then(
            () => Promise.reject(new Error('should have failed')),
            () => Promise.resolve('failed correctly')
          )
        )
      })

      // hooks were updated so transactions take care of this
      it.skip('patches the related issuance when CLOSED if offer user is issuer', function (done) {
        const initialSharesIssued = 22
        const offerQuantity = 200
        const offerCreateData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          quantity: offerQuantity
        })
        const issuanceCreateData = Object.assign({}, skels.issuance, {
          userId: this.user._id.toString(),
          sharesIssued: initialSharesIssued
        })

        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            issuanceServiceOnServer.create(issuanceCreateData).then(issuance => {
              const issuanceId = issuance._id.toString()
              assert(issuanceId, 'issuance created')
              assert.equal(issuance.sharesIssued, initialSharesIssued, 'issuance created correctly')

              offerCreateData.issuanceId = issuanceId

              serviceOnClient.create(offerCreateData)
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 2 })
                })
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 3 })
                })
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 4 })
                })
                .then(offer => {
                  assert.equal(offer.status, 'CLOSED')
                  return issuanceServiceOnServer.find({ query: { _id: issuanceId } })
                })
                .then(findResponse => {
                  const issuanceUpdated = findResponse.data[0]
                  assert.equal(issuanceUpdated.sharesIssued, initialSharesIssued + offerQuantity, 'sharesIssued was updated correctly')
                  done()
                })
                .catch(done)
            })
            .catch(done)
          })
      })

      // hooks were updated so transactions take care of this
      it.skip('patches the related issuance when CLOSED if order user is the issuer', function (done) {
        const initialSharesIssued = 11
        const offerQuantity = 10
        const offerCreateData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          quantity: offerQuantity
        })
        const issuanceCreateData = Object.assign({}, skels.issuance, {
          userId: '000000000000000000000000',
          sharesIssued: initialSharesIssued
        })

        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            issuanceServiceOnServer.create(issuanceCreateData).then(issuance => {
              const issuanceId = issuance._id.toString()
              assert(issuanceId, 'issuance created')
              assert.equal(issuance.sharesIssued, initialSharesIssued, 'issuance created correctly')

              offerCreateData.issuanceId = issuanceId

              serviceOnClient.create(offerCreateData)
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 2 })
                })
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 3 })
                })
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 4 })
                })
                .then(offer => {
                  assert.equal(offer.status, 'CLOSED')
                  return issuanceServiceOnServer.find({ query: { _id: issuanceId } })
                })
                .then(findResponse => {
                  const issuanceUpdated = findResponse.data[0]
                  assert.equal(issuanceUpdated.sharesIssued, initialSharesIssued - offerQuantity, 'shares returning to investor reduces sharesIssued')
                  done()
                })
                .catch(done)
            })
            .catch(done)
          })
      })

      it('does not patch the related issuance when CLOSED if neither offer or order user is the issuer', function (done) {
        const initialSharesIssued = 11
        const offerQuantity = (60 * SATOSHI)
        const offerCreateData = Object.assign({}, skels.sellOffer, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString(),
          quantity: offerQuantity
        })
        const issuanceCreateData = Object.assign({}, skels.issuance, {
          userId: '222222222222222222222222',
          sharesIssued: initialSharesIssued
        })

        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            issuanceServiceOnServer.create(issuanceCreateData).then(issuance => {
              const issuanceId = issuance._id.toString()
              assert(issuanceId, 'issuance created')
              assert.equal(issuance.sharesIssued, initialSharesIssued, 'issuance created correctly')

              offerCreateData.issuanceId = issuanceId

              serviceOnClient.create(offerCreateData)
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 2 })
                })
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 3 })
                })
                .then(offer => {
                  return serviceOnClient.patch(offer._id.toString(), { htlcStep: 4 })
                })
                .then(offer => {
                  assert.equal(offer.status, 'CLOSED')
                  return issuanceServiceOnServer.find({ query: { _id: issuanceId } })
                })
                .then(findResponse => {
                  const issuanceUpdated = findResponse.data[0]
                  assert.equal(issuanceUpdated.sharesIssued, initialSharesIssued, 'secondary market does not update sharesIssued')
                  done()
                })
                .catch(done)
            })
            .catch(done)
          })
      })

      it('sets offerId on HTLC tx #1 when created', function (done) {
        // Note: `txId` is different from `tx._id`.
        const txId = '21242f342bbef8ae5d170d06f73c8206323346ffc15548de2d0b10db7b7924c8'
        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            return app.service('transactions').create({
              fromAddress: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
              addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
              addressVout: 0,
              type: 'TRADE',
              currencyType: 'BTC',
              toAddress: '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z',
              amount: 777123,
              fee: 0.0001,
              txId,
              hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
            })
          })
          .then(tx => {
            const createData = Object.assign({}, skels.sellOffer, {
              orderId: this.order._id.toString(),
              userId: this.user._id.toString(),
              htlcTxId1: txId
            })
            return serviceOnClient.create(createData)
          })
          .then(offer => {
            const offerId = offer._id
            return app.service('transactions').find({ query: { txId } })
              .then(result => {
                const tx = result.data[0]
                assert.equal(tx.offerId, offerId, 'offerId set on transaction')
              }).then(() => done())
          })
          .catch(done)
      })
    })
  })
}
