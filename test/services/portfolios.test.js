const assert = require('assert')
const app = require('../../src/app')
require('../../test-utils/setup')
const clients = require('../../test-utils/make-clients')
const removeUsers = require('../../test-utils/utils').removeUsers
const userUtils = require('../../test-utils/user')
const assertRequiresAuth = require('../../test-utils/method.require-auth')

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`Portfolios Service Tests - ${transport}`, function () {
    beforeEach(function (done) {
      userUtils.create(app).then(user => {
        this.user = user
        done()
      })
    })

    afterEach(function (done) {
      feathersClient.logout()
        .then(() => userUtils.removeAll(app))
        .then(() => app.service('portfolios').remove(null, {}))
        .then(() => done())
    })

    it('registered the service', function () {
      const service = app.service('portfolios')

      assert.ok(service, 'Registered the service')
    })

    it(`requires auth for find requests from the client`, function (done) {
      assertRequiresAuth(feathersClient.service('portfolios'), 'find', assert, done)
    })

    it(`requires auth for get requests from the client`, function (done) {
      assertRequiresAuth(feathersClient.service('portfolios'), 'get', assert, done)
    })

    it(`requires auth for create requests from the client`, function (done) {
      assertRequiresAuth(feathersClient.service('portfolios'), 'create', assert, done)
    })

    it(`requires auth for update requests from the client`, function (done) {
      assertRequiresAuth(feathersClient.service('portfolios'), 'update', assert, done)
    })

    it(`requires auth for patch requests from the client`, function (done) {
      assertRequiresAuth(feathersClient.service('portfolios'), 'patch', assert, done)
    })

    it(`requires auth for remove requests from the client`, function (done) {
      assertRequiresAuth(feathersClient.service('portfolios'), 'remove', assert, done)
    })

    it.skip(`prevents a user from seeing another user's portfolios`, function () {

    })

    it('allows the find method for an authenticated user', function (done) {
      const user = this.user

      userUtils.authenticateTemp(app, feathersClient, user)
        .then(response => {
          feathersClient.service('portfolios')
            .find({ query: {} })
            .then(res => {
              const portfolios = res.data
              assert(portfolios.length === 0, 'the user has no portfolio by default')
              done()
            })
        })
        .catch(error => {
          assert(!error, 'this error should not have occurred')
          done()
        })
    })

    it.skip('allows the create method for an authenticated user', function (done) {
      const user = this.user

      userUtils.authenticate(app, feathersClient, user)
        .then(response => feathersClient.service('portfolios').create({
          name: 'my portfolio',
          address: 'mmxdeWW5h2nJ9qk7jXjzMBNnJewTnR8ubx'
        }))
        .then(res => {
          const portfolios = res.data
          assert(!portfolios, 'the user has no portfolio by default')
          done()
        })
        .catch(error => {
          assert(!error, 'this error should not have occurred')
          done()
        })
    })
  })
}
