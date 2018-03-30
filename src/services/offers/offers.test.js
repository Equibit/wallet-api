const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('offers')

  describe(`Offers Service Tests - ${transport}`, function () {
    before(function () {
      return userUtils.removeAll(app)
    })

    describe('Client Unauthenticated', function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          assertRequiresAuth(serviceOnClient, method)
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
            const createOrderSkel = {
              'userId': '000000000000000000000000',
              issuanceId: '000000000000000000000000',
              'issuanceAddress': '000000000000000000000000',
              'type': 'SELL',
              'portfolioId': '000000000000000000000000',
              'quantity': 60,
              'price': 10,
              'status': 'OPEN',
              'isFillOrKill': false,
              'goodFor': 7,
              'companyName': 'Foo',
              'issuanceName': 'Bar',
              'issuanceType': 'bonds'
            }
            return app.service('orders').create(createOrderSkel).then(order => {
              this.order = order
            })
          })
      })

      after(function () {
        return feathersClient.logout()
          .then(() => userUtils.removeAll(app))
          .then(() => app.service('orders').remove(null, { query: { userId: '000000000000000000000000' } }))
          .then(() => app.service('offers').remove(null, { query: { userId: '000000000000000000000000' } }))
      })

      if (transport === 'feathers-socketio') {
        it('Sends a real-time update', function (done) {
          const offer = {
            userId: '000000000000000000000000',
            orderId: this.order._id.toString(),
            type: 'SELL',
            issuanceAddress: '12345',
            quantity: 1,
            price: 0.00005,
            status: 'OPEN',

            // Issuance info:
            issuanceId: '000000000000000000000000',
            companyName: 'Test',
            issuanceName: 'Test',
            issuanceType: 'Stock',

            // EQB address to receive securities to for a BUY offer
            // eqbAddress: 'string',
            // BTC address to receive payment to for a SELL offer
            btcAddress: 'test-address',

            // HTLC:
            eqbAddress: 'some-address',
            timelock: 144,
            hashlock: '123'
          }

          const checkOffer = function checkOffer (offer) {
            assert(offer, 'should receive offer in the event')
            done()
          }

          serviceOnClient.once('created', checkOffer)

          serviceOnClient.create(offer)
            .catch(error => {
              done(error)
            })
        })
      }
    })

    describe('With Auth', function () {
      const createDataSkel = {
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
      }

      beforeEach(function (done) {
        userUtils.create(app).then(user => {
          this.user = user

          const createOrderSkel = {
            'userId': '000000000000000000000000',
            issuanceId: '000000000000000000000000',
            'issuanceAddress': '000000000000000000000000',
            'type': 'SELL',
            'portfolioId': '000000000000000000000000',
            'quantity': 60,
            'price': 10,
            'status': 'OPEN',
            'isFillOrKill': false,
            'goodFor': 7,
            'companyName': 'Foo',
            'issuanceName': 'Bar',
            'issuanceType': 'bonds'
          }
          return app.service('orders').create(createOrderSkel)
        }).then(order => {
          this.order = order
          done()
        })
      })

      afterEach(function (done) {
        feathersClient.logout()
          .then(() => app.service('offers').remove(null, { query: { userId: '000000000000000000000000' } }))
          .then(() => app.service('orders').remove(null, { query: { userId: '000000000000000000000000' } }))
          .then(() => userUtils.removeAll(app))
          .then(() => done())
      })

      it('sets offer.status automatically - normal flow and some edge cases', function (done) {
        const createData = Object.assign({}, createDataSkel, {
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
          assert.equal(err.message, 'Offer cannot be modified once CLOSED or CANCELLED.', 'Cannot be cancelled after closed')
          done()
        })
      })

      it('offer.status can be set to CANCELLED while OPEN - and cannot be changed after except in limited circumstances', function (done) {
        let txObj
        const createData = Object.assign({}, createDataSkel, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString()
        })
        userUtils.authenticateTemp(app, feathersClient, this.user)
        .then(loggedInResponse => {
          return app.service('transactions').create({
            address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
            addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
            addressVout: 0,
            type: 'SELL',
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
        .then(offer => {
          assert.equal(offer.status, 'OPEN')
          return serviceOnClient.patch(offer._id.toString(), { htlcStep: 2 })
        })
        .then(offer => {
          return serviceOnClient.patch(offer._id.toString(), {
            status: 'CANCELLED',
            htlcStep: 3,
            htlcTxId3: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba'
          })
        })
        .then(offer => {
          assert.equal(offer.status, 'CANCELLED', 'offer was cancelled')
          return serviceOnClient.patch(offer._id.toString(), {
            htlcStep: 4,
            htlcTxId4: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba'
          })
        })
        .then(offer => {
          assert.equal(offer.htlcStep, 4, 'offer htlcStep was updated')
          assert.equal(offer.htlcTxId4, '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba', 'offer htlcTxId4 was updated')
          return serviceOnClient.patch(offer._id.toString(), {
            status: 'CLOSED'
          })
        })
        .catch(err => {
          assert.equal(err.message, 'Offer cannot be modified once CLOSED or CANCELLED.', 'Offer cannot be modified once CANCELLED')
          app.service('transactions').remove(txObj._id)
          done()
        })
      })

      it('offer.status can be set to CANCELLED while TRADING', function (done) {
        const createData = Object.assign({}, createDataSkel, {
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

      const issuanceCreateData = {
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
        sharesIssued: 0
      }

      it('patches the related issuance when CLOSED if offer user is issuer', function (done) {
        const issuanceServiceOnServer = app.service('issuances')
        const initialSharesIssued = 22
        const offerQuantity = 200
        const offerCreateData = Object.assign({}, createDataSkel, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString()
        })
        issuanceCreateData.userId = this.user._id.toString()
        issuanceCreateData.sharesIssued = initialSharesIssued

        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            issuanceServiceOnServer.create(issuanceCreateData).then(issuance => {
              const issuanceId = issuance._id.toString()
              assert(issuanceId, 'issuance created')
              assert.equal(issuance.sharesIssued, initialSharesIssued, 'issuance created correctly')

              offerCreateData.issuanceId = issuanceId
              offerCreateData.quantity = offerQuantity

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

      it('patches the related issuance when CLOSED if order user is the issuer', function (done) {
        const issuanceServiceOnServer = app.service('issuances')
        const initialSharesIssued = 11
        const offerQuantity = 10
        const offerCreateData = Object.assign({}, createDataSkel, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString()
        })
        issuanceCreateData.userId = '000000000000000000000000'
        issuanceCreateData.sharesIssued = initialSharesIssued

        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            issuanceServiceOnServer.create(issuanceCreateData).then(issuance => {
              const issuanceId = issuance._id.toString()
              assert(issuanceId, 'issuance created')
              assert.equal(issuance.sharesIssued, initialSharesIssued, 'issuance created correctly')

              offerCreateData.issuanceId = issuanceId
              offerCreateData.quantity = offerQuantity

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
        const issuanceServiceOnServer = app.service('issuances')
        const initialSharesIssued = 11
        const offerQuantity = 100
        const offerCreateData = Object.assign({}, createDataSkel, {
          orderId: this.order._id.toString(),
          userId: this.user._id.toString()
        })
        issuanceCreateData.userId = '000000000000000000000001'
        issuanceCreateData.sharesIssued = initialSharesIssued

        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            issuanceServiceOnServer.create(issuanceCreateData).then(issuance => {
              const issuanceId = issuance._id.toString()
              assert(issuanceId, 'issuance created')
              assert.equal(issuance.sharesIssued, initialSharesIssued, 'issuance created correctly')

              offerCreateData.issuanceId = issuanceId
              offerCreateData.quantity = offerQuantity

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
    })
  })
}
