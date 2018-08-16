const assert = require('assert')
const app = require('../../app')

describe('\'twitter-campaign\' service', () => {
  it('registered the service', () => {
    const service = app.service('twitter-campaign')

    assert.ok(service, 'Registered the service')
  })
})
