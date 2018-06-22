const assert = require('assert')
const app = require('../../app')
const bitMessageService = app.service('bit-message')
const utils = require('../../../test-utils/index')

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`'bit-message' service - ${transport}`, () => {
    it('registered the service', () => {
      const service = app.service('bit-message')

      assert.ok(service, 'Registered the service')
    })
    it('send\'s a bad request when an attribute is missing', done => {
      bitMessageService.create({node: 'eqb'})
      .catch(err => {
        assert.ok(err)
        assert.equal(err.message, 'Requires node and message')
        done()
      })
    })
  })
}
