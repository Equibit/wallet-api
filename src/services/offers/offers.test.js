const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')
const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']
const objectid = require('objectid')

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('offers')

  describe(`Offers Service Tests - ${transport}`, function () {
    before(function () {
      return app.service('/users').remove(null, { query: { email: { $in: testEmails } } }) // Remove all users
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
        return app.service('users').remove(null, {})
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
                  const identifier = app.io.sockets.sockets[socketId].feathers.uid

                  // Create an address-map record with that socketId
                  // so a realtime event gets sent out
                  return app.service('address-map').create({
                    identifier,
                    address: 'test-address'
                  })
                }
              })
          })
      })

      after(function () {
        return feathersClient.logout()
          .then(() => app.service('users').remove(null, {}))
          .then(() => app.service('address-map').remove(null, {}))
      })

      if (transport === 'feathers-socketio') {
        it('Sends a real-time update', function (done) {
          const offer = {
            userId: objectid(),
            orderId: objectid(),
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
            console.log('on event', offer)
            done()
          }

          serviceOnClient.once('created', checkOffer)

          serviceOnClient.create(offer)
            .then(() => {
              console.log('after create')
            })
            .catch(error => {
              done(error)
            })
        })
      }
    })

    describe('With Auth', function () {
      beforeEach(function (done) {
        userUtils.create(app).then(user => {
          this.user = user
          done()
        })
      })

      afterEach(function (done) {
        feathersClient.logout()
          .then(() => app.service('issuances').remove(null, {}))
          .then(() => app.service('offers').remove(null, {}))
          .then(() => userUtils.removeAll(app))
          .then(() => done())
      })

      const createDataSkel = {
        userId: '000000000000000000000000',
        orderId: '000000000000000000000000',
        type: 'SELL',
        quantity: 10,
        price: 333,
        issuanceId: '000000000000000000000000',
        issuanceAddress: '000000000000000000000000',
        hashlock: '000000000000000000000000',
        timelock: 1234,
        btcAddress: '000000000000000000000000',
        eqbAddress: '000000000000000000000000'
      }

      it('sets offer.status automatically - normal flow and some edge cases', function (done) {
        const createData = Object.assign({}, createDataSkel)
        createData.userId = this.user._id.toString()
        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            serviceOnClient.create(createData)
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
      })

      it('offer.status can be set to CANCELLED while OPEN - and cannot be changed after', function (done) {
        const createData = Object.assign({}, createDataSkel)
        createData.userId = this.user._id.toString()
        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            serviceOnClient.create(createData)
              .then(offer => {
                assert.equal(offer.status, 'OPEN')
                return serviceOnClient.patch(offer._id.toString(), { status: 'CANCELLED' })
              })
              .then(offer => {
                assert.equal(offer.status, 'CANCELLED', 'offer was cancelled')
                return serviceOnClient.patch(offer._id.toString(), {})
              })
              .catch(err => {
                assert.equal(err.message, 'Offer cannot be modified once CLOSED or CANCELLED.', 'Offer cannot be modified once CANCELLED')
                done()
              })
          })
      })

      it('offer.status can be set to CANCELLED while TRADING', function (done) {
        const createData = Object.assign({}, createDataSkel)
        createData.userId = this.user._id.toString()
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
        const offerCreateData = Object.assign({}, createDataSkel)
        offerCreateData.userId = this.user._id.toString()
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

      it('does not patch the related issuance when CLOSED if offer user is not the issuer', function (done) {
        const issuanceServiceOnServer = app.service('issuances')
        const initialSharesIssued = 11
        const offerQuantity = 100
        const offerCreateData = Object.assign({}, createDataSkel)
        offerCreateData.userId = this.user._id.toString()
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
