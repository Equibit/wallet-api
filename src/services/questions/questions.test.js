const assert = require('assert')
const app = require('../../app')

describe('\'questions\' service', () => {
  it('registered the service', () => {
    const service = app.service('questions')

    assert.ok(service, 'Registered the service')
  })
})
