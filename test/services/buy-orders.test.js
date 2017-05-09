const assert = require('assert')
const app = require('../../src/app')

describe('\'buy-orders\' service', () => {
  it('registered the service', () => {
    const service = app.service('buy-orders')

    assert.ok(service, 'Registered the service')
  })
})
