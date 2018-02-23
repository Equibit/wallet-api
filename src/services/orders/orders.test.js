const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')
const userUtils = utils.users
const testEmails = userUtils.testEmails

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('portfolios')

  describe(`Orders Service Tests - ${transport}`, function () {
    before(function () {
      return userUtils.removeAll(app)
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
        return serviceOnClient.create({ email: testEmails[0].toUpperCase() })
          .then(user => {
            assert(user.email === testEmails[0].toLowerCase(), 'the signup email was lowerCased')
          })
      })
    })
  })
}
