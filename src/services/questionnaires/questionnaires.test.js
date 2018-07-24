const assert = require('assert')
const app = require('../../app')

describe('\'questionnaires\' service', () => {
  it('registered the service', () => {
    const service = app.service('questionnaires')

    assert.ok(service, 'Registered the service')
  })
})
