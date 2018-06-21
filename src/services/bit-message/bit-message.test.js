const assert = require('assert')
const app = require('../../app')

describe('\'bit-message\' service', () => {
  it('registered the service', () => {
    const service = app.service('bit-message')

    assert.ok(service, 'Registered the service')
  })
})
