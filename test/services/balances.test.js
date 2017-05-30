const assert = require('assert')
const app = require('../../src/app')
require('../../test-utils/setup')
const clients = require('../../test-utils/make-clients')
const removeUsers = require('../../test-utils/utils').removeUsers

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`Portfolios Service Tests - ${transport}`, function () {
    it('registered the service', function () {
      const service = app.service('balances')

      assert.ok(service, 'Registered the service')
    })

    // it('returns a balance', function (done) {
    //   feathersClient.service('balances')
    //     .find({ query: {} })
    //     .then(res => {
    //       debugger
    //     })
    // })
  })
}
