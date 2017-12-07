const assert = require('assert')
const app = require('../../../src/app')
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

  describe.only(`Orders Service Tests - ${transport}`, function () {
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
        return utils.users.create(app)
          .then(user => utils.users.authenticate(app, feathersClient, user))
      })

      after(function () {
        return feathersClient.logout()
          .then(() => app.service('users').remove(null, {}))
      })

      it.skip('Sends a real-time update', function (done) {
        const offer = {
          userId: objectid(),
          orderId: objectid(),
          type: "SELL",
          issuanceAddress: "12345",
          quantity: 1,
          price: .00005,
          status: 'OPEN',

          // Issuance info:
          companyName: 'Test',
          issuanceName: 'Test',
          issuanceType: 'Stock',

          // EQB address to receive securities to for a BUY offer
          eqbAddress: 'string',
          // BTC address to receive payment to for a SELL offer
          btcAddress: 'string'
        }

        const checkOffer = function checkOffer (offer) {
          console.log(offer)
        }

        serviceOnClient.on('created', checkOffer)

        serviceOnClient.create(offer)
          .then(() => {
            done()
          })
          .catch(error => {
            done(error)
          })
      })
    })
  })
}
