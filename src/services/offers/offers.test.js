const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')
const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']
const objectid = require('objectid')

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('offers')

  describe(`Orders Service Tests - ${transport}`, function () {
    before(function () {
      return app.service('/users').remove(null, { query: { email: { $in: testEmails } } }) // Remove all users
    })

    describe('Client Without Auth', function () {
      it(`requires auth for find requests from the client`, function () {
        assertRequiresAuth(serviceOnClient, 'find')
      })

      it(`requires auth for get requests from the client`, function () {
        assertRequiresAuth(serviceOnClient, 'get')
      })

      it(`requires auth for create requests from the client`, function () {
        assertRequiresAuth(serviceOnClient, 'create')
      })

      it(`requires auth for update requests from the client`, function () {
        assertRequiresAuth(serviceOnClient, 'update')
      })

      it(`requires auth for patch requests from the client`, function () {
        assertRequiresAuth(serviceOnClient, 'patch')
      })

      it(`requires auth for remove requests from the client`, function () {
        assertRequiresAuth(serviceOnClient, 'remove')
      })
    })

    describe('Client With Auth', function () {
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
            issuanceId: 'test',

            // Issuance info:
            companyName: 'Test',
            issuanceName: 'Test',
            issuanceType: 'Stock',

            // EQB address to receive securities to for a BUY offer
            // eqbAddress: 'string',
            // BTC address to receive payment to for a SELL offer
            btcAddress: 'test-address',

            // HTLC:
            eqbAddressHolding: 'some-address',
            timelock: 144,
            hashlock: '123'
          }

          const checkOffer = function checkOffer (offer) {
            assert(offer, 'should receive offer in the event')
            console.log('on event', offer)
            done()
          }

          serviceOnClient.on('created', checkOffer)

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
  })
}
