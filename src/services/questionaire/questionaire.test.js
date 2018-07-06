const assert = require('assert')
const app = require('../../app')

describe('\'questionaire\' service', () => {
  it('registered the service', () => {
    const service = app.service('questionaire')

    assert.ok(service, 'Registered the service')
  })
})
