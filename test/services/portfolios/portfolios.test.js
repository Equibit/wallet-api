const assert = require('assert')
const app = require('../../../src/app')
require('../../../test-utils/setup')
const clients = require('../../../test-utils/make-clients')
const removeUsers = require('../../../test-utils/utils').removeUsers
const userUtils = require('../../../test-utils/user')
const assertRequiresAuth = require('../../../test-utils/method.require-auth')

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('portfolios')

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

    describe('Client Without Auth', function () {
      it(`requires auth for find requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'find', done)
      })

      it(`requires auth for get requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'get', done)
      })

      it(`requires auth for create requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'create', done)
      })

      it(`requires auth for update requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'update', done)
      })

      it(`requires auth for patch requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'patch', done)
      })

      it(`requires auth for remove requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'remove', done)
      })
    })

    describe('With Auth', function () {
      beforeEach(function (done) {
        // Remove all portfolios before each test.
        app.service('portfolios').remove(null, {})
          .then(response => {
            done()
          })
      })

      it('allows users to create a portfolio', function (done) {
        const user = this.user
        const name = 'My Portfolio'

        userUtils.authenticateTemp(app, feathersClient, user)
          .then(response => feathersClient.service('portfolios').create({ name }))
          .then(portfolio => {
            const allowedFields = [
              '__v',
              '_id',
              'name',
              'index',
              'balance',
              'createdAt',
              'updatedAt',
              'addressesMeta',
              'userId'
            ]
            Object.keys(portfolio).forEach(field => {
              assert(allowedFields.includes(field), `the ${field} field was allowed in the response.`)
            })
            assert(portfolio.name === name, 'portfolio was created')
            assert(portfolio.index === 1, 'the portfolio has the correct index')
            assert(portfolio.userId === user._id.toString(), 'the portfolio was assigned to the user')
            done()
          })
          .catch(error => {
            assert(!error, 'this error should not have occurred')
            done()
          })
      })

      it.skip('validates the xPub', function (done) {

      })

      it('returns an error when attempting to manually edit the portfolio balance', function (done) {
        const user = this.user
        const name = 'My Portfolio'

        userUtils.authenticateTemp(app, feathersClient, user)
          .then(response => feathersClient.service('portfolios').create({
            name,
            balance: 0
          }))
          .then(portfolio => {
            assert(!portfolio, 'should have received an error')
            done()
          })
          .catch(error => {
            assert(error.className === 'bad-request', 'returned a bad request error')
            assert(error.code === 400, 'returned the proper error code')
            assert(error.message.includes('cannot be manually adjusted'), 'returned a descriptive error message')
            done()
          })
      })

      it('user has no portfolio by default', function (done) {
        const user = this.user

        userUtils.authenticateTemp(app, feathersClient, user)
          .then(response => {
            feathersClient.service('portfolios')
              .find({ query: {} })
              .then(res => {
                const portfolios = res.data || res
                assert(portfolios.length === 0, 'the user has no portfolio by default')
                done()
              })
          })
          .catch(error => {
            assert(!error, 'this error should not have occurred')
            done()
          })
      })

      it('allows the create method for an authenticated user', function (done) {
        const user = this.user

        userUtils.authenticate(app, feathersClient, user)
          .then(response => feathersClient.service('portfolios').create({
            name: 'my portfolio'
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
  })
}
