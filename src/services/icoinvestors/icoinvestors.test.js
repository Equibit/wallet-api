const assert = require('assert')
const app = require('../../app')

describe('\'icoinvestors\' service', () => {
  it('registered the service', () => {
    const service = app.service('icoinvestors')

    assert.ok(service, 'Registered the service')
  })
})
