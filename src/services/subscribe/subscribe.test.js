const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const { clients, users: userUtils } = require('../../../test-utils/index')
const { authenticate } = require('../../../test-utils/users')
const assertDisallowed = require('../../../test-utils/assert/disallows')

const socketClient = clients[0]
const restClient = clients[1]

const testEmails = userUtils.testEmails

describe(`Subscribe Service Tests - feathers-socketio`, function () {
  const feathersClient = socketClient

  describe('Create', function () {
    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: testEmails[0] }))
        .then(user => app.service('/users').find({ query: { email: testEmails[0] } }))
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
        .then(() => userUtils.removeAll(app))
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    it('updates the socket with an addresses property', function (done) {
      const currentUser = this.user
      const addresses = [ 'address1', 'address2', 'address3' ]

      const serviceOnClient = feathersClient.service('subscribe')

      authenticate(app, feathersClient, currentUser)
        .then(response => {
          return serviceOnClient.create({ addresses })
        })
        .then(response => {
          // const socketId = Object.keys(app.io.sockets.sockets).filter(socketId => {
          //   const user = app.io.sockets.sockets[socketId].feathers.user
          //   if (user && !user._id) {
          //     console.log('*** !!! *** ')
          //     console.log('*** !!! *** socket user._id is undefined!!! user: ', user)
          //     console.log('*** !!! *** ')
          //   }
          //   return user && user._id && (user._id.toString() === currentUser._id.toString())
          // })
          const socket = Object.keys(app.io.sockets.sockets).reduce((socket, socketId) => {
            if (socket) {
              return socket
            } else {
              const candidateSocket = app.io.sockets.sockets[socketId]
              return candidateSocket.feathers &&
                candidateSocket.feathers.user._id.toString() === currentUser._id.toString()
                ? candidateSocket : null
            }
          }, null)
          assert(socket.feathers.uid, 'the socket has a uid property')
          assert(typeof socket.feathers.uid === 'string', 'the uid is a string')
          addresses.forEach(address => {
            assert(socket.feathers.addresses[address], 'has address ' + address)
          })
          done()
        })
        .catch(error => {
          console.log(error)
          assert(!error, error.message)
          done()
        })
    })

    it.skip('upserts', function (done) {
      const data = { address: '123', identifier: 'my-identifier' }
      const params = {
        query: { address: '123' },
        mongoose: { upsert: true }
      }
      app.service('address-meta').patch(null, data, params)
        .then(response => {
          const data = response.data || response
          assert(Array.isArray(data), 'data should be an array')
        })
        .catch(error => {
          console.log(error)
        })
    })
  })
})

describe('Subscribe Service Tests - feathers-rest', function () {
  const feathersClient = restClient
  const serviceOnClient = feathersClient.service('subscribe')

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

  describe('REST client disallowed', function () {
    it(`find`, function () {
      assertDisallowed(serviceOnClient, 'find')
    })

    it(`get`, function () {
      assertDisallowed(serviceOnClient, 'get')
    })

    it(`create`, function () {
      assertDisallowed(serviceOnClient, 'create')
    })

    it(`update`, function () {
      assertDisallowed(serviceOnClient, 'update')
    })

    it(`patch`, function () {
      assertDisallowed(serviceOnClient, 'patch')
    })

    it(`remove`, function () {
      assertDisallowed(serviceOnClient, 'remove')
    })
  })

  describe('Client With Auth', function () {
    it(`find`, function () {
      assertDisallowed(serviceOnClient, 'find')
    })

    it(`get`, function () {
      assertDisallowed(serviceOnClient, 'get')
    })

    it(`create`, function () {
      assertDisallowed(serviceOnClient, 'create')
    })

    it(`update`, function () {
      assertDisallowed(serviceOnClient, 'update')
    })

    it(`patch`, function () {
      assertDisallowed(serviceOnClient, 'patch')
    })

    it(`remove`, function () {
      assertDisallowed(serviceOnClient, 'remove')
    })
  })
})
