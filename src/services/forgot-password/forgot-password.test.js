const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users
const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`forgot-password Service Tests - ${transport}`, function () {
    before(function () {
      return userUtils.removeAll(app)
    })

    beforeEach(function (done) {
      app.service('users').create({ email: testEmails[0] })
        .then(user => app.service('users').find({ query: { email: { $in: testEmails } } }))
        .then(users => {
          this.user = users.data[0]
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    afterEach(function (done) {
      // Remove all users and forgot-password after tests run.
      feathersClient.logout()
        .then(() => userUtils.removeAll(app))
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    it(`only implements the create method`, function () {
      const forgot = app.service('forgot-password')
      const methods = ['find', 'get', 'update', 'patch', 'remove']
      methods.forEach(method => {
        assert(forgot[method] === undefined, `there was no ${method} method`)
      })
      assert(typeof forgot.create === 'function', 'there was a create method')
    })

    it(`does not leak information in the response`, function (done) {
      const user = this.user

      feathersClient.service('forgot-password').create({ email: user.email })
        .then(res => {
          assert.deepEqual(res, { email: user.email })
          done()
        })
        .catch(error => {
          assert(!error, 'this should not have happened')
        })
    })

    it(`sets the tempPassword for an existing user, reuses the salt`, function (done) {
      const user = this.user
      const { salt, tempPassword } = this.user

      feathersClient.service('forgot-password').create({ email: user.email })
        .then(res => {
          return app.service('users').get(user._id)
        })
        .then(user => {
          assert(typeof user.tempPassword === 'string', 'the user contained a tempPassword')
          assert(user.tempPassword !== tempPassword, 'a new tempPassword was assigned to the user')
          assert(user.salt === salt, 'the salt remained the same')
          done()
        })
        .catch(error => {
          assert(!error, 'this should not have happened')
        })
    })
  })
}
