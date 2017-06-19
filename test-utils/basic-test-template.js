const assert = require('assert')
const app = require('../src/app')
// const makeSigned = require('feathers-authentication-signed/client')
// const crypto = require('crypto')
require('../test-utils/setup')
const clients = require('../test-utils/make-clients')
const removeUsers = require('../test-utils/utils').removeUsers
const { authenticate } = require('../../test-utils/user')
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
    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: 'test@equibit.org' }))
        .then(() => app.service('/users').create({ email: 'test2@equibit.org' }))
        .then(user => app.service('/users').find({ query: {} }))
        .then(users => {
          users = users.data || users
          this.user = users[0]
          this.user2 = users[1]
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    afterEach(function (done) {
      // Remove all users after tests run.
      feathersClient.logout()
        .then(() => app.service('/users').remove(null, {}))
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

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
      it.skip('ooooooooooooo', function (done) {
        const user = this.user

        authenticate(app, feathersClient, user)
          .then(response => {
            assert(response, 'authenticated successfully')
            done()
          })
          .catch(error => {
            assert(!error, `should have been able to authenticate`)
            done()
          })
      })
    })
  })
}
