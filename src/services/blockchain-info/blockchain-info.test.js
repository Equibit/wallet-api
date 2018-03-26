const assert = require('assert')
const app = require('../../src/app')

describe('\'blockchain-info\' service', () => {
  it('registered the service', () => {
    const service = app.service('blockchain-info')

    assert.ok(service, 'Registered the service')
  })
})
