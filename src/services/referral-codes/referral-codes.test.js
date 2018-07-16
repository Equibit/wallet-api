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

  describe(`Referral Codes Service Tests - ${transport}`, function () {
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

    it('registered the service', function () {
      const service = app.service('referral-codes')

      assert.ok(service, 'Registered the service')
    })

    it(`creates referral code when user is created`, function (done) {
      const user = this.user
      const email = user.email

      app.service('/referral-codes').find({ query: { userEmail: email } })
        .then(res => {
          assert(res.data[0].userEmail === email, 'referral code is linked to user email')
          assert(res.data[0].userId.toString() === user._id.toString(), 'userIds match')
          done()
        })
        .catch(error => {
          assert(false, error.message)
          done()
        })
    })
  })
}
