const assert = require('assert')
const app = require('../../src/app')

describe('\'sell-orders\' service', () => {
  it('registered the service', () => {
    const service = app.service('sell-orders')

    assert.ok(service, 'Registered the service')
  })
})
