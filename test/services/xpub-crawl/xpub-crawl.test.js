const assert = require('assert')
const app = require('../../../src/app')
const utils = require('../../../test-utils/index')

const service = '/xpub-crawl'
const serviceOnServer = app.service(service)
const xpubs = utils.xpub()

describe.skip(`${service} Service`, function () {
  utils.clients.forEach(client => {
    runTests(client)
  })

  describe(`${service} - Server`, function () {
    // before(function () {})
    // after(function () {})
    beforeEach(function () {
      return serviceOnServer.remove(null, {}) // Remove all records
    })
    // afterEach(function () {})

    describe('find', function () {
      it.skip('', function (done) {})
    })

    describe('get', function () {
      it.skip('', function (done) {})
    })

    describe('create', function () {
      it.skip('', function (done) {})
    })

    describe('update', function () {
      it.skip('', function (done) {})
    })

    describe('patch', function () {
      it.skip('', function (done) {})
    })

    describe('remove', function () {
      it.skip('', function (done) {})
    })
  })
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service(service)

  describe(`${service} - ${transport} Transport`, function () {
    before(function () {
      return app.service('/users').remove(null, {}) // Remove all users
    })

    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: 'test@equibitgroup.com' }))
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
      feathersClient.logout()
        .then(() => app.service('/users').remove(null, {})) // Remove all users
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    describe(`${service} - Unauthenticated Client`, function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          utils.assert.requiresAuth(serviceOnClient, method)
        })
      })

      describe('find', function () {})

      describe('get', function () {})

      describe('create', function () {})

      describe('update', function () {})

      describe('patch', function () {})

      describe('remove', function () {})
    })

    describe(`${service} - Authenticated Client`, function () {
      beforeEach(function () {
        utils.transactions.resetMock()
      })
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it.skip(`works with auth on ${method}`, function () {
          utils.assert.requiresAuth(serviceOnClient, method)
        })
      })

      describe('find', function () {
        it('crawls the gap of 20', function (done) {
          const user = this.user

          utils.users.authenticate(app, feathersClient, user)
            .then(response => serviceOnClient.find({ query: { type: 'btc', xpub: xpubs.btc } }))
            .then(response => {
              assert(response.addresses, 'received addresses')
              assert(Object.keys(response.addresses).length === 1, 'One addresses was used')
              assert(response.addressesByIndex, 'received addressesByIndex')
              assert(Object.keys(response.addressesByIndex).length === 23, '23 addresses were crawled')
              assert(response.summary.total, 'received summary total')
              assert(response.type === 'BTC', 'received correct type')
              done()
            })
            .catch(error => {
              assert(!error, error)
              done()
            })
        })
      })

      describe('get', function () {})

      describe('create', function () {})

      describe('update', function () {})

      describe('patch', function () {})

      describe('remove', function () {})
    })
  })
}
