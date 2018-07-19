const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const { clients } = require('../../../test-utils/index')
const userUtils = require('../../../test-utils/users')
const { testEmails } = userUtils

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`Users Service Tests - ${transport}`, function () {
    const allowedUserFields = [
      '_id',
      'email',
      'createdAt',
      'updatedAt',
      'salt',
      'isNewUser',
      'emailVerified',
      'twoFactorValidatedSession',
      'passwordCreatedAt',
      'tempPasswordCreatedAt',
      'provisionalSalt',
      'hasRecordedMnemonic',
      'autoLogoutTime'
    ]

    before(function () {
      return userUtils.removeAll(app)
    })

    after(function () {
      return userUtils.removeAll(app)
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
      // Remove all users after tests run.
      feathersClient.logout()
        .then(() => userUtils.removeAll(app))
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    it('returns a generic response when creating a user', function () {
      const userService = feathersClient.service('/users')
      const email = testEmails[0]

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
      return app.service('users').create({ email: testEmails[0].toUpperCase() })
        .then(user => {
          assert(user.email === testEmails[0].toLowerCase(), 'the signup email was lowerCased')
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
          return feathersClient.service('users').patch(user._id, { requestPasswordChange: true })
        })
        .then(res => {
          return feathersClient.service('users').patch(user._id, { password: 'new password', salt: res.provisionalSalt })
        })
        .then(user => {
          Object.keys(user).forEach(field => {
            assert(allowedUserFields.includes(field), `the "${field}" field was returned in the user object`)
          })
          done()
        })
        .catch(error => {
          assert(false, error.message + '\n' + error.stack)
          done()
        })
    })

    it(`allows an authenticated user to change passwords`, function (done) {
      const user = this.user

      assert(user.password === undefined, 'there was no password for a new user')

      userUtils.authenticateTemp(app, feathersClient, user)
        .then(res => feathersClient.service('users').patch(user._id, { requestPasswordChange: true }))
        .then(res => feathersClient.service('users').patch(user._id, { password: 'new password', salt: res.provisionalSalt }))
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

    it(`requires a provisional salt only when changing from non-temp password`, function (done) {
      const user = this.user
      let _provisionalSalt

      userUtils.authenticateTemp(app, feathersClient, user)
        .then(res => app.service('/users').patch(user._id, { tempPassword: 'temp password', password: '' }))
        .then(res => feathersClient.service('users').patch(user._id, { password: 'old password', salt: res.salt })
          .then(res => {
            assert(true, 'password change allowed, no salt change')
            return res
          }, error => {
            assert(false, 'error on temp password change: ' + error.message)
          })
        )
        .then(
          res => feathersClient.service('users').patch(user._id, { oldPassword: 'old password', requestPasswordChange: true })
            .catch(error => assert(false, 'requesting password change failed: ' + error.message))
        )
        .then(res => {
          _provisionalSalt = res.provisionalSalt
          return feathersClient.service('users').patch(user._id, { password: 'new password' })
            .then(() => {
              assert(false, 'password change allowed; this should have failed')
            }, error => {
              assert(error.code === 400, `BadRequest error was thrown when trying to change password without salt`)
            })
        })
        .then(res => feathersClient.service('users').patch(user._id, { password: 'new password', salt: 'not the provisional salt' })
          .then(() => {
            assert(false, 'password change allowed; this should have failed')
          },
          error => {
            assert(error.code === 400, `BadRequest was thrown when trying to change password with incorrect salt`)
          })
        )
        .then(res => feathersClient.service('users').patch(user._id, { password: 'new password', salt: _provisionalSalt })
          .then(null, () => {
            assert(false, `error was thrown when trying to change password with correct salt; this should not have happened`)
          })
        )
        .then(done.bind(null, null), done)
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

    it('requires 2FA to change an email', function (done) {
      const user = this.user
      userUtils.authenticate(app, feathersClient, user)
        .then(res => {
          feathersClient.service('users')
            .patch(res.user._id, { email: testEmails[2] })
            .then(user => {
              assert(false, 'This wasn\'t supposed to happen')
              done()
            }, error => {
              assert(error.message === 'Must validate session with 2FA', 'two-factor auth was required')
              done()
            })
        })
    })

    it(`doesn't leak verification codes for 2FA`, function (done) {
      const user = this.user

      userUtils.authenticateTemp(app, feathersClient, user)
        .then(res => {
          return feathersClient.service('users').patch(user._id, { requestTwoFactorCode: true })
        })
        .then(user => {
          Object.keys(user).forEach(field => {
            assert(allowedUserFields.includes(field), `the "${field}" field was returned in the user object`)
          })
          done()
        })
        .catch(error => {
          assert(false, error.message)
          done()
        })
    })

    it(`doesn't leak verification codes for email changes`, function (done) {
      const user = this.user
      userUtils.authenticateTemp(app, feathersClient, user)
        .then(res => {
          return app.service('/users').patch(user._id, { twoFactorValidatedSession: true })
        }).then(res => {
          return feathersClient.service('users').patch(user._id, { email: testEmails[2] })
        })
        .then(user => {
          Object.keys(user).forEach(field => {
            assert(allowedUserFields.includes(field), `the "${field}" field was returned in the user object`)
          })
          done()
        })
        .catch(error => {
          assert(false, error.message)
          done()
        })
    })

    it(`marks email as unverified after change`, function (done) {
      const user = this.user
      app.service('/users').patch(user._id, { emailVerified: true })
        .then(() => {
          return userUtils.authenticateTemp(app, feathersClient, user)
        }).then(res => {
          return app.service('/users').patch(user._id, { twoFactorValidatedSession: true })
        }).then(res => {
          return feathersClient.service('users').patch(user._id, { email: testEmails[2] })
        })
        .then(user => {
          assert(user.emailVerified === false, 'email is not verified')
          done()
        })
        .catch(error => {
          assert(error.className === 'not-authenticated', 'auth was required')
          done()
        })
    })

    it('Updates the referral info table when a new user is created', function (done) {
      const code = 'abc123'
      const email = 'referraluser@test.com'
      app.service('/referral-codes').create({ referralCode: code })
      .then(() => app.service('/users').create({ email: email, referral: code }))
      .then(() => app.service('/referral-info').find({ query: { referralCode: code } }))
      .then(res => {
        const info = res.data[0]
        assert.equal(info.referralCode, code)
        assert.equal(info.email, email)
      })
      .then(() => app.service('/users').remove(null, { query: { email: email } }))
      .then(() => app.service('/referral-codes').remove(null, { query: { referralCode: code } }))
      .then(() => {
        app.service('/referral-info').remove(null, { query: { referralCode: code } })
        done()
      })
      .catch(error => {
        assert(false, error.message)
        done()
      })
    })
  })
}
