const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const { clients } = require('../../../test-utils/index')
const userUtils = require('../../../test-utils/users')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')

const service = '/portfolios'

describe(`${service} Service`, function () {
  clients.forEach(client => {
    runTests(client)
  })
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('portfolios')

  describe(`${service} - ${transport} Transport`, function () {
    before(function () {
      return userUtils.removeAll(app)
    })

    beforeEach(function (done) {
      userUtils.create(app).then(user => {
        this.user = user
        done()
      })
    })

    afterEach(function (done) {
      feathersClient.logout()
        .then(() => userUtils.removeAll(app))
        .then(() => app.service('portfolios').remove(null, { query: { name: 'My Test Portfolio' } }))
        .then(() => done())
    })

    it('registered the service', function () {
      const service = app.service('portfolios')

      assert.ok(service, 'Registered the service')
    })

    describe('Client Unauthenticated', function () {
      it(`requires auth for find requests from the client`, function () {
        return assertRequiresAuth(serviceOnClient, 'find')
      })

      it(`requires auth for get requests from the client`, function () {
        return assertRequiresAuth(serviceOnClient, 'get')
      })

      it(`requires auth for create requests from the client`, function () {
        return assertRequiresAuth(serviceOnClient, 'create')
      })

      it(`requires auth for update requests from the client`, function () {
        return assertRequiresAuth(serviceOnClient, 'update')
      })

      it(`requires auth for patch requests from the client`, function () {
        return assertRequiresAuth(serviceOnClient, 'patch')
      })

      it(`requires auth for remove requests from the client`, function () {
        return assertRequiresAuth(serviceOnClient, 'remove')
      })
    })

    describe('With Auth', function () {
      beforeEach(function (done) {
        // Remove all portfolios before each test.
        app.service('portfolios').remove(null, { query: { name: 'My Test Portfolio' } })
          .then(response => {
            done()
          })
      })

      it('allows users to create a portfolio', function (done) {
        const user = this.user
        const name = 'My Test Portfolio'

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
              'importFrom',
              'userId'
            ]
            Object.keys(portfolio).forEach(field => {
              assert(allowedFields.includes(field), `the ${field} field was allowed in the response.`)
            })
            assert(portfolio.name === name, 'portfolio was created')
            assert(portfolio.index === 0, 'the portfolio has the correct index')
            assert(portfolio.userId === user._id.toString(), 'the portfolio was assigned to the user')
            done()
          })
          .catch(error => {
            console.log('ERROR ', error)
            assert(!error, 'this error should not have occurred')
            done()
          })
      })

      it.skip('validates the xPub', function (done) {

      })

      it('returns an error when attempting to manually edit the portfolio balance', function (done) {
        const user = this.user
        const name = 'My Test Portfolio'

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
            name: 'My Test Portfolio'
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
