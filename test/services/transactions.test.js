const assert = require('assert')
const app = require('../../src/app')
// const makeSigned = require('feathers-authentication-signed/client')
// const crypto = require('crypto')
require('../../test-utils/setup')
const clients = require('../../test-utils/make-clients')
const removeUsers = require('../../test-utils/utils').removeUsers
const assertRequiresAuth = require('../../test-utils/method.require-auth')

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('transactions')

  describe(`Transaction Service Tests - ${transport}`, function () {
    describe('Client Without Auth', function () {
      it(`requires auth for find requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'find', assert, done)
      })

      it(`requires auth for get requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'get', assert, done)
      })

      it(`requires auth for create requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'create', assert, done)
      })

      it(`requires auth for update requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'update', assert, done)
      })

      it(`requires auth for patch requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'patch', assert, done)
      })

      it(`requires auth for remove requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'remove', assert, done)
      })
    })

    describe('Client With Auth', function () {
      it.skip('allows find', function () {
        return app.service('users').create({ email: 'ADMIN@EQUIBIT.ORG' })
          .then(user => {
            assert(user.email === 'admin@equibit.org', 'the signup email was lowerCased')
          })
      })

      it.skip(`maps update to patch`, function (done) {})

      it.skip(`requires signature of user's private key to create`, function (done) {})

      it.skip(`requires signature of user's private key to update/patch`, function (done) {})

      it.skip('retrieves records by address', function (done) {})

      it.skip('retrieves records by txnId', function (done) {})

      it.skip('requires companyName and issuanceName if type === EQB', function (done) {})

      it.skip('only allows the creator to update the description', function (done) {})
    })
  })
}
