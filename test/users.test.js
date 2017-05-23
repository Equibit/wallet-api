const assert = require('assert')
const app = require('../src/app')
require('../test-utils/setup')
const clients = require('../test-utils/make-clients')
const removeUsers = require('../test-utils/utils').removeUsers
const userUtils = require('../test-utils/user')

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`Users Service Tests - ${transport}`, function () {
    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: 'test@equibit.org' }))
        .then(user => app.service('/users').find({ query: {} }))
        .then(users => {
          users = users.data || users
          this.user = users[0]
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

    it('returns a generic response when creating a user', function () {
      const userService = feathersClient.service('/users')
      const email = 'some-user@equibit.org'

      return userService.create({ email })
        .then(body => {
          let expectedResponse = { email }
          assert.deepEqual(body, expectedResponse, `the response only included the new user's email`)
        })
    })

    it(`doesn't allow outside access to users`, function () {
      const userService = feathersClient.service('/users')

      return userService.find({ query: {} })
        .then(response => {
          assert(!response)
        })
        .catch(error => {
          assert(error.name === 'NotAuthenticated')
        })
    })

    it('lowerCases email addresses', function () {
      return app.service('users').create({ email: 'ADMIN@EQUIBIT.ORG' })
        .then(user => {
          assert(user.email === 'admin@equibit.org', 'the signup email was lowerCased')
        })
    })

    it(`requires auth to change a password`, function (done) {
      const user = this.user

      feathersClient.service('users')
        .patch(user._id, { password: 'new password' })
        .catch(error => {
          assert(error.className === 'not-authenticated', 'auth was required')
          done()
        })
    })
  })
}
