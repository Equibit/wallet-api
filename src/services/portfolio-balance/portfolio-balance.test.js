const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')

const service = '/portfolio-balance'
const serviceOnServer = app.service(service)
const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']

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

      describe('find', function () {})

      describe('get', function () {})

      describe('create', function () {})

      describe('update', function () {})

      describe('patch', function () {})

      describe('remove', function () {})
    })

    describe(`${service} - Authenticated Client`, function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it.skip(`works with auth on ${method}`, function () {
          utils.assert.requiresAuth(serviceOnClient, method)
        })
      })

      it.skip('', function (done) {
        const user = this.user

        utils.user.authenticate(app, feathersClient, user)
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
