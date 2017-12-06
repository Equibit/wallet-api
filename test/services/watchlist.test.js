const assert = require('assert')
const app = require('../../src/app')
const utils = require('../../test-utils/index')
const assertRequiresAuth = require('../../test-utils/assert/requires-auth')
const userUtils = require('../../test-utils/users')
const objectid = require('objectid')

const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']

const service = '/watchlist'

describe(`${service} Service`, function () {
  utils.clients.forEach(client => {
    runTests(client)
  })
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('watchlist')

  describe(`${service} - ${transport} Transport`, function () {
    before(function () {
      return app.service('/users').remove(null, { query: { email: { $in: testEmails } } })
    })
    after(function () {
      return Promise.all([
        app.service('/users').remove(null, { query: { email: { $in: testEmails } } }),
        app.service('/companies').remove(null, { query: { name: 'test-company' } }),
        app.service('/watchlist').remove(null, { query: { companyName: 'test-company' } })
      ])
    })

    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: testEmails[0] }))
        .then(() => app.service('/users').create({ email: testEmails[1] }))
        .then(user => app.service('/users').find({ query: { email: { $in: testEmails } } }))
        .then(users => {
          users = users.data || users
          this.user = users[0]
          this.user2 = users[1]

          // Next, create watch data for random users
          return [
            {_id: objectid(), name: 'test-company'},
            {_id: objectid(), name: 'test-company'},
            {_id: objectid(), name: 'test-company'}
          ]
        })
        .then(response => {
          const companies = response.data || response
          const watchers = []
          this.companies = companies

          for (var index = 0; index < companies.length; index++) {
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
            // console.log(`watcher`, watcher)
            watchers[index] = watcher // .toObject()
          })
          this.watchers = watchers
          done()
        })
        .catch(error => {
          console.log('Error:::', error)
          assert(!error, 'should have been able to create some fake watchlist data')
          done()
        })
    })

    afterEach(function (done) {
      feathersClient.logout()
        // Remove all users after tests run.
        .then(() => app.service('/users').remove(null, { query: { email: { $in: testEmails } } }))
        // Remove all watch data
        .then(() => app.service('watchlist').remove(null, {}))
        .then(() => { done() })
        .catch(error => {
          console.log(error)
        })
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
            assert(!error, 'should not have received this error: ' + error.message)
            done()
          })
      })
    })
  })
}
