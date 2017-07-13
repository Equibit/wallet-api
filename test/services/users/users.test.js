const assert = require('assert')
const app = require('../../../src/app')
require('../../../test-utils/setup')
const { clients } = require('../../../test-utils/index')
const userUtils = require('../../../test-utils/users')

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`Users Service Tests - ${transport}`, function () {
    before(function () {
      return app.service('/users').remove(null, {}) // Remove all users
    })

    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: 'test@equibit.org' }))
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

    it(`doesn't leak any data in the change password response`, function (done) {
      const user = this.user

      userUtils.authenticateTemp(app, feathersClient, user)
        .then(res => {
          return feathersClient.service('users').patch(user._id, { password: 'new password' })
        })
        .then(user => {
          const allowedUserFields = [
            '_id',
            'email',
            'createdAt',
            'updatedAt',
            'salt',
            'isNewUser'
          ]
          Object.keys(user).forEach(field => {
            assert(allowedUserFields.includes(field), `the "${field}" field was returned in the user object`)
          })
          done()
        })
        .catch(error => {
          assert(error.className === 'not-authenticated', 'auth was required')
          done()
        })
    })

    it(`allows an authenticated user to change passwords`, function (done) {
      const user = this.user

      assert(user.password === undefined, 'there was no password for a new user')

      userUtils.authenticateTemp(app, feathersClient, user)
        .then(res => feathersClient.service('users').patch(user._id, { password: 'new password' }))
        .then(res => app.service('users').get(user._id))
        .then(patchedUser => {
          assert(typeof patchedUser.password === 'string', 'the user now has a password')
          done()
        })
        .catch(error => {
          assert(!error, error.message)
          done()
        })
    })

    it(`removes the tempPassword from the user after password change`, function (done) {
      const user = this.user
      const user2 = this.user2

      userUtils.authenticateTemp(app, feathersClient, user)
        .then(res => feathersClient.service('users').patch(user2._id, { password: 'new password' }))
        .then(res => {
          assert(!res, 'the request should have failed')
          done()
        })
        .catch(error => {
          assert(error.code === 403, 'the correct error code was returned')
          assert(error.name === 'Forbidden', `the user could not change another user's password`)
          done()
        })
    })

    it('performs a patch in place of an update request', function (done) {
      const user = this.user

      userUtils.authenticate(app, feathersClient, user)
        .then(res => {
          const newUser = res.user
          assert(newUser.isNewUser === false, 'the user is not a new user')
          return feathersClient.service('users').update(user._id, { isNewUser: true })
        })
        .then(updatedUser => {
          assert(updatedUser.isNewUser === true, 'the isNewUser attribute was updated')
          assert(updatedUser.email === user.email, 'the user still has an email, so the record was patched')
          done()
        })
        .catch(error => {
          assert(!error, 'should not have received an error here')
          done()
        })
    })

    it('sends back a salt when the password is changed', function (done) {
      const user = this.user

      userUtils.authenticateTemp(app, feathersClient, user)
        .then(res => {
          const newUser = res.user
          assert(newUser.isNewUser === true, 'the user is a new user')
          return feathersClient.service('users').update(user._id, { isNewUser: true })
        })
        .then(updatedUser => {
          assert(updatedUser.salt, 'we should have received a salt back after update')
          return feathersClient.service('users').patch(user._id, { isNewUser: true })
        })
        .then(updatedUser => {
          assert(updatedUser.salt, 'we should have received a salt back after patch')
          done()
        })
        .catch(error => {
          assert(!error, 'should not have received an error here')
          done()
        })
    })

    it.skip('does not allow removing the password', function (done) {
      const user = this.user

      userUtils.authenticate(app, feathersClient, user)
        .then(res => {
          const newUser = res.user
          assert(newUser.isNewUser === false, 'the user is not a new user')
          return feathersClient.service('users').update(user._id, { isNewUser: true })
        })
        .then(updatedUser => {
          assert(updatedUser.isNewUser === true, 'the request should have failed')
          assert(updatedUser.email === user.email, 'the user still has an email, so the record was patched')
          done()
        })
        .catch(error => {
          assert(!error, 'should not have received an error here')
          done()
        })
    })
  })
}
