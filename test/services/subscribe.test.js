const assert = require('assert')
const app = require('../../src/app')

describe('\'subscribe\' service', () => {
  it('registered the service', () => {
    const service = app.service('subscribe')

    assert.ok(service, 'Registered the service')
  })
})
