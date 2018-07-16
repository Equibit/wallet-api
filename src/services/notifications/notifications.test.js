const assert = require('assert')
const app = require('../../app')
const { clients, users: userUtils } = require('../../../test-utils/index')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')

const { testEmails, authenticate } = userUtils

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('notifications')

  describe(`'notifications' service -- ${transport}`, function () {
    describe('Client Unauthenticated', function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          assertRequiresAuth(serviceOnClient, method)
        })
      })
    })

    describe('With Auth', function () {
      beforeEach(function (done) {
        feathersClient.logout()
          .then(() => userUtils.removeAll(app))
          .then(() => app.service('/users').create({ email: testEmails[0] }))
          .then(user => app.service('/users').find({ query: { email: testEmails[0] } }))
          .then(users => {
            this.user = users.data[0]
            return authenticate(app, feathersClient, this.user)
          }).then(() => {
            done()
          }).catch(done)
      })

      afterEach(function (done) {
        feathersClient.logout()
          .then(() => userUtils.removeAll(app))
          .then(() => app.service('/notifications').remove(null, { query: { type: 'test' } }))
          .then(() => { done() })
          .catch(done)
      })

      describe('create', function () {
        it('sends notification to subscribed socket', function (done) {
          if (transport === 'feathers-rest') {
            return done()
          }

          const address = Math.random().toString(36)
          const notificationSkel = {
            address,
            type: 'test',
            data: {}
          }

          const handler = function (notification) {
            assert(notification, 'received a notification')
            // console.log(app.io.sockets.sockets)
            feathersClient.service('notifications').off('created', handler)
            done()
          }
          feathersClient.service('notifications').on('created', handler)

          feathersClient.service('subscribe').create({addresses: [address]})
            .then(response => {
              return serviceOnClient.create(notificationSkel)
            })
            .catch(error => {
              console.error(error)
              assert(!error, error.message)
              done()
            })
        })
      })

      describe('updates', function () {
        beforeEach(function (done) {
          const notificationSkel = {
            'address': '000000000000000000000000',
            'type': 'test',
            'data': { 'one': 'two' },
            'isRead': false
          }

          app.service('/notifications').create(notificationSkel)
            .then(notification => {
              this.notification = notification
              done()
            })
        })

        afterEach(function (done) {
          app.service('/notifications').remove(null, { query: { address: '000000000000000000000000' } })
          .then(() => done())
          .catch(done)
        })

        it('only allows isRead to be updated by external', function (done) {
          serviceOnClient.patch(this.notification._id.toString(), {
            address: '1',
            type: 'fake-transaction',
            data: { foo: 'bar' },
            isRead: true
          }).then(notification => {
            assert.equal(notification.address, '000000000000000000000000', 'address did not change')
            assert.equal(notification.type, 'test', 'type did not change')
            assert.equal(notification.data.one, 'two', 'data did not change')
            assert.equal(notification.data.foo, undefined, 'data did not change')
            assert.equal(notification.isRead, true, 'isRead DID change')
            done()
          }).catch(err => {
            done(err)
          })
        })
      })
    })
  })
}
