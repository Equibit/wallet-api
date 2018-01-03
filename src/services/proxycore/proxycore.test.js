'use strict'

const assert = require('assert')
const app = require('../../app')

describe('proxycore service', function () {
  it('registered the /proxycore service', () => {
    assert.ok(app.service('proxycore'))
  })
})
