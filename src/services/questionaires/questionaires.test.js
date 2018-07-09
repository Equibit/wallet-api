const assert = require('assert')
const app = require('../../app')

describe('\'questionaires\' service', () => {
  it('registered the service', () => {
    const service = app.service('questionaires')

    assert.ok(service, 'Registered the service')
  })
})
