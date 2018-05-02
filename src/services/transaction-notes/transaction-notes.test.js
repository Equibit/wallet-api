const assert = require('assert')
const app = require('../../app')

describe('\'transaction-notes\' service', () => {
  it('registered the service', () => {
    const service = app.service('transaction-notes')

    assert.ok(service, 'Registered the service')
  })
})
