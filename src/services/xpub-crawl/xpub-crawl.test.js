const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']

const service = '/xpub-crawl'
const serviceOnServer = app.service(service)
const xpubs = utils.xpub()

describe(`${service} Service`, function () {
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
      return app.service('/users').remove(null, { query: { email: { $in: testEmails } } }) // Remove all users
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
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    afterEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').remove(null, { query: { email: { $in: testEmails } } })) // Remove all users
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
    })

    describe(`${service} - Authenticated Client`, function () {
      beforeEach(function () {
        utils.transactions.setupMock()
      })
      afterEach(function () {
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
          const query = { portfolioId: null, type: 'btc', xpub: xpubs.btc }

          utils.users.authenticate(app, feathersClient, user)
            .then(response => feathersClient.service('portfolios').create({ name: 'my portfolio' }))
            .then(portfolio => {
              query.portfolioId = portfolio._id
              return serviceOnClient.find({ query })
            })
            .then(response => {
              assert(response, 'received response')
              const changeAddresses = response.changeAddresses
              const externalAddresses = response.externalAddresses
              assert(changeAddresses, 'received changeAddresses')
              assert(externalAddresses, 'received externalAddresses')

              assert.equal(changeAddresses.length, 22, 'correct number of changeAddresses crawled')
              assert(changeAddresses[0]._id, 'change address have an _id specifying the corresponding portfolio-addresses meta record')
              assert.equal(changeAddresses[0].amount, 125000000, 'correct amount on first change address')
              assert.equal(changeAddresses[0].isUsed, true, 'first change address is marked as used')
              assert.equal(changeAddresses[0].isChange, true, 'first change address is marked as such')
              assert.equal(changeAddresses[1].amount, 275000000, 'correct amount on second change address')
              assert.equal(changeAddresses[2].amount, 0, 'third change address unused')
              // ... all these in between are unused too
              assert.equal(changeAddresses[21].amount, 0, 'last change address crawled was unused')
              assert.equal(changeAddresses[20].isUsed, false, 'last change address crawled is marked unused')

              assert.equal(externalAddresses.length, 21, 'correct number of externalAddresses crawled')
              assert(externalAddresses[0]._id, 'external address have an _id specifying the corresponding portfolio-addresses meta record')
              assert.equal(externalAddresses[0].amount, 136000000, 'correct amount on first external address')
              assert.equal(externalAddresses[0].isUsed, true, 'first external address is marked as used')
              assert.equal(externalAddresses[0].isChange, false, 'first external address is marked as not change')
              assert.equal(externalAddresses[1].amount, 0, 'second external address unused')
              assert.equal(externalAddresses[12].amount, 0, 'spot check, thirteenth external address unused')
              // ... all these in between are unused too
              assert.equal(externalAddresses[20].amount, 0, 'last external address crawled was unused')
              assert.equal(externalAddresses[20].isUsed, false, 'last external address crawled is marked unused')
              done()
            })
            .catch(error => {
              done(error)
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
