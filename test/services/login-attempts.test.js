const assert = require('assert')
const app = require('../../src/app')
// const makeSigned = require('feathers-authentication-signed/client')
// const crypto = require('crypto')
require('../../test-utils/setup')
const clients = require('../../test-utils/make-clients')
const removeUsers = require('../../test-utils/utils').removeUsers
const assertDisallowed = require('../../test-utils/method.disallow')

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`login-attempts Service Tests - ${transport}`, function () {
    beforeEach(function (done) {
      app.service('login-attempts').remove(null, {})
        .then(() => app.service('users').create({ email: 'test@equibit.org' }))
        .then(user => app.service('users').find({ query: {} }))
        .then(users => {
          this.user = users.data[0]
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    afterEach(function (done) {
      // Remove all users and login-attempts after tests run.
      feathersClient.logout()
        .then(() => app.service('login-attempts').remove(null, {}))
        .then(() => app.service('users').remove(null, {}))
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    it(`logs failed login attempts`, function (done) {
      const user = this.user
      const invalidLoginParams = {
        strategy: 'challenge',
        email: user.email,
        challenge: '62e67d3a4e96fb45bb7e2f1a993f08f610e8b39b981e6000bf52ff5e4f77c87217f9681e4d645e7d944831c43577968b125f72ed43328767701141ed67360efb',
        signature: '0f6a2edd0c133c561f0f6ae017061733c87ef282676270d28d887f5889ee3dee35346b44d64e53ff6dba84516d799df6609db1ef6d60e4b01b26d5ea4cd45f60'
      }
      const loginAttempts = app.service('login-attempts')

      // Remove all login-attempts before running this test.
      loginAttempts.remove(null, {})
        // Then try logging in with bad credentials
        .then(() => feathersClient.authenticate(invalidLoginParams))
        .catch(error => {
          loginAttempts.find()
          .then(attempts => {
            const attempt = attempts.data[0]
            assert(attempt.status === 'FAILURE', 'the login attempt failed')
            assert(error.className === attempt.error.className, 'the logged error matches the login error')
            assert.deepEqual(attempt.data, invalidLoginParams, 'the logged attempt matched the login data')
            done()
          })
        })
    })

    it(`adds to the user's failedLogins[]`, function (done) {
      const user = this.user
      const invalidLoginParams = {
        strategy: 'challenge',
        email: user.email,
        challenge: '62e67d3a4e96fb45bb7e2f1a993f08f610e8b39b981e6000bf52ff5e4f77c87217f9681e4d645e7d944831c43577968b125f72ed43328767701141ed67360efb',
        signature: '0f6a2edd0c133c561f0f6ae017061733c87ef282676270d28d887f5889ee3dee35346b44d64e53ff6dba84516d799df6609db1ef6d60e4b01b26d5ea4cd45f60'
      }
      const userService = app.service('users')

      feathersClient.authenticate(invalidLoginParams)
        .catch(() => {
          // debugger;
          return userService.get(user._id)
        })
        .then(user => {
          // debugger
          assert(user.failedLogins.length === 1, 'the user had one failed login attempt')
          done()
        })
    })

    it(`sends an email after three failed login attempts`, function (done) {
      const user = this.user
      const invalidLoginParams = {
        strategy: 'challenge',
        email: user.email,
        challenge: '62e67d3a4e96fb45bb7e2f1a993f08f610e8b39b981e6000bf52ff5e4f77c87217f9681e4d645e7d944831c43577968b125f72ed43328767701141ed67360efb',
        signature: '0f6a2edd0c133c561f0f6ae017061733c87ef282676270d28d887f5889ee3dee35346b44d64e53ff6dba84516d799df6609db1ef6d60e4b01b26d5ea4cd45f60'
      }
      const loginAttempts = app.service('login-attempts')

      feathersClient.authenticate(invalidLoginParams)
        .catch(() => feathersClient.authenticate(invalidLoginParams))
        .catch(() => feathersClient.authenticate(invalidLoginParams))
        .catch(() => loginAttempts.find())
        .then(attempts => {
          assert(attempts.data.length === 3, 'there are three logged invalid login attempts')
          attempts.data.forEach(attempt => {
            assert(attempt.status === 'FAILURE')
            assert.deepEqual(attempt.data, invalidLoginParams, 'the login data matched in each logged attempt')
          })
          // assert(attempt.status === 'FAILURE', 'the login attempt failed')
          // assert.deepEqual(attempt.data, invalidLoginParams, 'the logged attempt matched the login data')
          done()
        })
    })

    it(`rejects find requests from the client`, function (done) {
      assertDisallowed(feathersClient.service('login-attempts'), 'find', assert, done)
    })

    it(`rejects get requests from the client`, function (done) {
      assertDisallowed(feathersClient.service('login-attempts'), 'get', assert, done)
    })

    it(`rejects create requests from the client`, function (done) {
      assertDisallowed(feathersClient.service('login-attempts'), 'create', assert, done)
    })

    it(`rejects update requests from the client`, function (done) {
      assertDisallowed(feathersClient.service('login-attempts'), 'update', assert, done)
    })

    it(`rejects patch requests from the client`, function (done) {
      assertDisallowed(feathersClient.service('login-attempts'), 'patch', assert, done)
    })

    it(`rejects remove requests from the client`, function (done) {
      assertDisallowed(feathersClient.service('login-attempts'), 'remove', assert, done)
    })
  })
}
