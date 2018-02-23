const assert = require('assert')
const app = require('../../../src/app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users

const servicePath = '/______'
const serviceOnServer = app.service(servicePath)

describe(`${servicePath} Service`, function () {
  utils.clients.forEach(client => {
    runTests(client)
  })

  describe(`${servicePath} - Server`, function () {
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
  const serviceOnClient = feathersClient.service(servicePath)

  describe(`${servicePath} - ${transport} Transport`, function () {
    before(function () {
      return userUtils.removeAll(app)
    })

    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: userUtils.testEmails[0] }))
        .then(() => app.service('/users').create({ email: userUtils.testEmails[1] }))
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
        .then(() => userUtils.removeAll(app))
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    describe(`${servicePath} - Unauthenticated Client`, function () {
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

    describe(`${servicePath} - Authenticated Client`, function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it.skip(`works with auth on ${method}`, function () {
          utils.assert.requiresAuth(serviceOnClient, method)
        })
      })

      describe('Grants Access to the Authenticated User', function () {})
      describe('Protects Other Users\' Data', function () {})

      it.skip('', function (done) {
        const user = this.user

        utils.users.authenticate(app, feathersClient, user)
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
