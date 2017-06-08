const assert = require('assert')
const app = require('../../src/app')
// const makeSigned = require('feathers-authentication-signed/client')
// const crypto = require('crypto')
require('../../test-utils/setup')
const clients = require('../../test-utils/make-clients')
const removeUsers = require('../../test-utils/utils').removeUsers
const assertRequiresAuth = require('../../test-utils/method.require-auth')
const userUtils = require('../../test-utils/user')
const objectid = require('objectid')

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('watchlist')

  describe(`Watch Service Tests - ${transport}`, function () {
    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: 'test@equibit.org' }))
        .then(() => app.service('/users').create({ email: 'test2@equibit.org' }))
        .then(user => app.service('/users').find({ query: {} }))
        .then(users => {
          users = users.data || users
          this.user = users[0]
          this.user2 = users[1]

          // Next, create watch data for random users
          return app.service('companies').find({ query: {} })
        })
        .then(response => {
          const companies = response.data || response
          const watchers = []
          this.companies = companies

          for (var index = 0; index < 10; index++) {
            const company = companies[index]
            watchers.push({
              companyId: company._id,
              companyName: company.name,
              userId: objectid()
            })
          }
          return app.service('watchlist').create(watchers)
        })
        .then(watchers => {
          watchers.forEach((watcher, index) => {
            watchers[index] = watcher.toObject()
          })
          this.watchers = watchers
          done()
        })
        .catch(error => {
          assert(!error, 'should have been able to create some fake watchlist data')
          done()
        })
    })

    afterEach(function (done) {
      feathersClient.logout()
        // Remove all users after tests run.
        .then(() => app.service('/users').remove(null, {}))
        // Remove all watch data
        .then(() => app.service('watchlist').remove(null, {}))
        .then(() => { done() })
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
      it('allows user to find own watchlist', function (done) {
        const user = this.user
        const company = this.companies[0]

        userUtils.authenticate(app, feathersClient, user)
          .then(response => serviceOnClient.create({
            companyId: company._id,
            companyName: company.name,
            userId: user._id
          }))
          .then(watchItem => {
            assert(watchItem._id, 'was able to add item to watch list')
            return serviceOnClient.find({ query: {} })
          })
          .then(response => {
            const watchItems = response.data || response
            assert(watchItems.length === 1, 'only one watchlist item should have been returned')
            done()
          })
          .catch(error => {
            assert(!error, 'should not have received this error')
            done()
          })
      })
    })
  })
}
