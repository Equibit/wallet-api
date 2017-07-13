const assert = require('assert')
const app = require('../../src/app')
const utils = require('../../test-utils/index')
const assertRequiresAuth = require('../../test-utils/assert/requires-auth')

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('portfolios')

  describe(`Orders Service Tests - ${transport}`, function () {
    before(function () {
      return app.service('/users').remove(null, {}) // Remove all users
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
      it.skip('ooooooooooooo', function () {
        return serviceOnClient.create({ email: 'ADMIN@EQUIBIT.ORG' })
          .then(user => {
            assert(user.email === 'admin@equibit.org', 'the signup email was lowerCased')
          })
      })
    })
  })
}
