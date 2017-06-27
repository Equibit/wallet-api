const assert = require('assert')
const app = require('../../../src/app')
// const makeSigned = require('feathers-authentication-signed/client')
// const crypto = require('crypto')
require('../../../test-utils/setup')
const clients = require('../../../test-utils/make-clients')
const removeUsers = require('../../../test-utils/utils').removeUsers
const { authenticate } = require('../../../test-utils/user')
const assertRequiresAuth = require('../../../test-utils/method.require-auth')
const assertDisallowed = require('../../../test-utils/method.disallow')

// Remove all users before all tests run.
before(removeUsers(app))

const socketClient = clients[0]
const restClient = clients[1]

describe(`Subscribe Service Tests - feathers-socketio`, function () {
  const feathersClient = socketClient
  const serviceOnClient = feathersClient.service('subscribe')

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

  describe('Client Without Auth', function () {
    it(`requires auth for find requests from the client`, function (done) {
      assertRequiresAuth(serviceOnClient, 'find', done)
    })

    it(`requires auth for get requests from the client`, function (done) {
      assertRequiresAuth(serviceOnClient, 'get', done)
    })

    it(`requires auth for create requests from the client`, function (done) {
      assertRequiresAuth(serviceOnClient, 'create', done)
    })

    it(`requires auth for update requests from the client`, function (done) {
      assertRequiresAuth(serviceOnClient, 'update', done)
    })

    it(`requires auth for patch requests from the client`, function (done) {
      assertRequiresAuth(serviceOnClient, 'patch', done)
    })

    it(`requires auth for remove requests from the client`, function (done) {
      assertRequiresAuth(serviceOnClient, 'remove', done)
    })
  })

  describe('Client With Auth', function () {
    describe('Create', function () {
      it('updates the socket with the provided addresses', function (done) {
        const user = this.user
        const addresses = [ 'address1', 'address2', 'address3' ]

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.create({ addresses })
          })
          .then(response => {
            const socketId = Object.keys(app.io.sockets.sockets).filter(socketId => {
              return app.io.sockets.sockets[socketId].feathers.user._id.toString() === user._id.toString()
            })
            const socketObject = app.io.sockets.sockets[socketId].feathers
            addresses.forEach(address => {
              assert(socketObject.addresses[address] === true, 'the address was added to the socketObject')
            })
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it.skip('throws if socket isn\'t authenticated', function (done) {
        const user = this.user

        authenticate(app, feathersClient, user)
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
})

describe('Subscribe Service Tests - feathers-rest', function () {
  const feathersClient = restClient
  const serviceOnClient = feathersClient.service('subscribe')

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

  describe('REST client disallowed', function () {
    it(`find`, function (done) {
      assertDisallowed(serviceOnClient, 'find', done)
    })

    it(`get`, function (done) {
      assertDisallowed(serviceOnClient, 'get', done)
    })

    it(`create`, function (done) {
      assertDisallowed(serviceOnClient, 'create', done)
    })

    it(`update`, function (done) {
      assertDisallowed(serviceOnClient, 'update', done)
    })

    it(`patch`, function (done) {
      assertDisallowed(serviceOnClient, 'patch', done)
    })

    it(`remove`, function (done) {
      assertDisallowed(serviceOnClient, 'remove', done)
    })
  })

  describe('Client With Auth', function () {
    it(`find`, function (done) {
      assertDisallowed(serviceOnClient, 'find', done)
    })

    it(`get`, function (done) {
      assertDisallowed(serviceOnClient, 'get', done)
    })

    it(`create`, function (done) {
      assertDisallowed(serviceOnClient, 'create', done)
    })

    it(`update`, function (done) {
      assertDisallowed(serviceOnClient, 'update', done)
    })

    it(`patch`, function (done) {
      assertDisallowed(serviceOnClient, 'patch', done)
    })

    it(`remove`, function (done) {
      assertDisallowed(serviceOnClient, 'remove', done)
    })
  })
})
