const assert = require('assert')
const app = require('../../../src/app')
require('../../../test-utils/setup')
const { clients } = require('../../../test-utils/index')
const { authenticate } = require('../../../test-utils/users')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')
const assertDisallowed = require('../../../test-utils/assert/disallows')

const socketClient = clients[0]
const restClient = clients[1]

describe(`Subscribe Service Tests - feathers-socketio`, function () {
  before(function () {
    return app.service('/users').remove(null, {}) // Remove all users
  })

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
    it(`requires auth for find requests from the client`, function () {
      assertRequiresAuth(serviceOnClient, 'find')
    })

    it(`requires auth for get requests from the client`, function () {
      assertRequiresAuth(serviceOnClient, 'get')
    })

    it(`requires auth for create requests from the client`, function () {
      assertRequiresAuth(serviceOnClient, 'create')
    })

    it(`requires auth for update requests from the client`, function () {
      assertRequiresAuth(serviceOnClient, 'update')
    })

    it(`requires auth for patch requests from the client`, function () {
      assertRequiresAuth(serviceOnClient, 'patch')
    })

    it(`requires auth for remove requests from the client`, function () {
      assertRequiresAuth(serviceOnClient, 'remove')
    })
  })

  describe('Client With Auth', function () {
    describe('Create', function () {
      beforeEach(function () {
        return app.service('address-map').remove(null, {})
      })

      it('updates the socket with a uid property', function (done) {
        const user = this.user
        const addresses = [ 'address1', 'address2', 'address3' ]

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.create({ addresses })
          })
          .then(response => {
            const socketId = Object.keys(app.io.sockets.sockets).filter(socketId => {
              const user = app.io.sockets.sockets[socketId].feathers.user
              return user && (user._id.toString() === user._id.toString())
            })
            const socket = app.io.sockets.sockets[socketId].feathers
            assert(socket.uid, 'the socket has a uid property')
            assert(typeof socket.uid === 'string', 'the uid is a string')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it('adds records to the /address-map service', function (done) {
        const user = this.user
        const addresses = [ 'address1', 'address2', 'address3' ]

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.create({ addresses })
          })
          .then(response => {
            return app.service('address-map').find({ query: { address: {$in: addresses} } })
          })
          .then(response => {
            const addressMappings = response.data || response
            assert(addressMappings.length === 3, 'All three addresses were added to /address-map')
            done()
          })
          .catch(error => {
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

      it('re-uses existing addresses', function (done) {
        const user = this.user
        const addresses = [ 'address1' ]

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.create({ addresses })
          })
          .then(response => {
            return serviceOnClient.create({ addresses })
          })
          .then(response => {
            return app.service('address-map').find({ query: { address: {$in: addresses} } })
          })
          .then(response => {
            const addressMappings = response.data || response
            assert(addressMappings.length === 1, 'the address was reused')
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
