const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const { clients } = require('../../../test-utils/index')

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`Referral Codes Service Tests - ${transport}`, function () {
    it('registered the service', function () {
      const service = app.service('referral-codes')

      assert.ok(service, 'Registered the service')
    })
  })
}
