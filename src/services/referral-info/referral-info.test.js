const assert = require('assert')
const app = require('../../app')

describe('\'referral-info\' service', () => {
  it('registered the service', () => {
    const service = app.service('referral-info')

    assert.ok(service, 'Registered the service')
  })
})
