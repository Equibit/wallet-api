const assert = require('assert')
const app = require('../../src/app')

describe('\'address-meta\' service', () => {
  it('registered the service', () => {
    const service = app.service('address-meta')

    assert.ok(service, 'Registered the service')
  })
})
