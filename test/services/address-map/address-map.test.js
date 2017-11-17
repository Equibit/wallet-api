const assert = require('assert')
const app = require('../../../src/app')
require('../../../test-utils/setup')
const { clients } = require('../../../test-utils/index')
const { authenticate } = require('../../../test-utils/users')
const assertDisallowed = require('../../../test-utils/assert/disallows')

const servicePath = '/address-map'
const socketClient = clients[0]
const restClient = clients[1]
const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']

describe(`${servicePath} Service Tests - feathers-socketio`, function () {
  before(function () {
    return app.service('/users').remove(null, { query: { email: { $in: testEmails } } }) // Remove all users
  })

  const feathersClient = socketClient
  const serviceOnServer = app.service('address-map')
  const serviceOnClient = feathersClient.service('address-map')

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
      .then(() => app.service('/users').remove(null, { query: { email: { $in: testEmails } } }))
      .then(() => {
        done()
      })
      .catch(error => {
        console.log(error)
      })
  })

  describe(`${servicePath} - Unauthenticated Client`, function () {
    it(`requires auth for find requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'find')
    })

    it(`requires auth for get requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'get')
    })

    it(`requires auth for create requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'create')
    })

    it(`requires auth for update requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'update')
    })

    it(`requires auth for patch requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'patch')
    })

    it(`requires auth for remove requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'remove')
    })
  })

  describe(`${servicePath} - Authenticated Client`, function () {
    it(`requires auth for find requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'find')
    })

    it(`requires auth for get requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'get')
    })

    it(`requires auth for create requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'create')
    })

    it(`requires auth for update requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'update')
    })

    it(`requires auth for patch requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'patch')
    })

    it(`requires auth for remove requests from the client`, function () {
      assertDisallowed(serviceOnClient, 'remove')
    })

    describe('Create', function () {
      it('encrypts the identifier property', function (done) {
        const user = this.user
        const identifier = '12345'
        const address = 'address1'

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnServer.create({identifier, address})
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

      it('re-uses existing addresses with different identifiers', function (done) {
        const user = this.user
        const identifier = '123'
        const address = 'address1'

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnServer.create({ identifier, address })
          })
          .then(response => {
            const identifier1 = response.identifier
            assert(identifier1 !== identifier, 'the identifier was encrypted')

            return serviceOnServer.create({ identifier, address })
              .then(response => {
                const identifier2 = response.identifier
                assert(identifier2 !== identifier1 && identifier2 !== identifier, 'all were different')

                return app.service('address-map').find({ query: { address } })
                  .then(response => {
                    const addressMappings = response.data || response
                    assert(addressMappings.length === 1, 'the address was reused')
                    done()
                  })
              })
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it.skip('only allows a single address', function () {})

      it.skip('prevents createMany', function () {})
    })
  })
})

describe('address-map Service Tests - feathers-rest', function () {
  const feathersClient = restClient
  const serviceOnClient = feathersClient.service('address-map')

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
      .then(() => app.service('/users').remove(null, { query: { email: { $in: testEmails } } }))
      .then(() => {
        done()
      })
      .catch(error => {
        console.log(error)
      })
  })

  describe(`${servicePath} - REST client disallowed`, function () {
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

  describe(`${servicePath} - Authenticated Client Disallowed`, function () {
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
