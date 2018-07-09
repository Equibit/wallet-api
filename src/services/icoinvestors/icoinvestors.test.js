const assert = require('assert')
const app = require('../../app')

describe('\'icoinvestors\' service', () => {
  it('registered the service', () => {
    const service = app.service('src/icoinvestors')

    assert.ok(service, 'Registered the service')
  })
})
