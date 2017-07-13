const assert = require('assert')
const app = require('../../../src/app')

describe('\'portfolio-balance\' service', () => {
  it('registered the service', () => {
    const service = app.service('portfolio-balance')

    assert.ok(service, 'Registered the service')
  })
})
