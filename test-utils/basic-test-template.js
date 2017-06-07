const assert = require('assert')
const app = require('../src/app')
// const makeSigned = require('feathers-authentication-signed/client')
// const crypto = require('crypto')
require('../test-utils/setup')
const clients = require('../test-utils/make-clients')
const removeUsers = require('../test-utils/utils').removeUsers
const assertRequiresAuth = require('../../../test-utils/method.require-auth')

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('portfolios')

  describe(`_______ Service Tests - ${transport}`, function () {
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
      it('ooooooooooooo', function () {
        return app.service('users').create({ email: 'ADMIN@EQUIBIT.ORG' })
          .then(user => {
            assert(user.email === 'admin@equibit.org', 'the signup email was lowerCased')
          })
      })
    })
  })
}
