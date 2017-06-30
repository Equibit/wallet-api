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

describe(`address-map Service Tests - feathers-socketio`, function () {
  const feathersClient = socketClient
  const serviceOnServer = app.service('address-map')
  const serviceOnClient = feathersClient.service('address-map')

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
      assertDisallowed(serviceOnClient, 'find', done)
    })

    it(`requires auth for get requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'get', done)
    })

    it(`requires auth for create requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'create', done)
    })

    it(`requires auth for update requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'update', done)
    })

    it(`requires auth for patch requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'patch', done)
    })

    it(`requires auth for remove requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'remove', done)
    })
  })

  describe('Client With Auth', function () {
    it(`requires auth for find requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'find', done)
    })

    it(`requires auth for get requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'get', done)
    })

    it(`requires auth for create requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'create', done)
    })

    it(`requires auth for update requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'update', done)
    })

    it(`requires auth for patch requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'patch', done)
    })

    it(`requires auth for remove requests from the client`, function (done) {
      assertDisallowed(serviceOnClient, 'remove', done)
    })

    describe('Create', function () {
      it('encrypts the identifier property', function (done) {
        const user = this.user
        const identifier = '12345'
        const address = 'address1'

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnServer.create({ identifier, address })
          })
          .then(map => {
            assert(map.identifier !== identifier, 'the identifier was encrypted')
            assert(map.address === address, 'the address is still the same')
            assert(map.createdAt, 'createdAt attr is present')
            assert(map.updatedAt, 'updatedAt attr is present')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })
    })
  })
})

describe('address-map Service Tests - feathers-rest', function () {
  const feathersClient = restClient
  const serviceOnClient = feathersClient.service('address-map')

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
