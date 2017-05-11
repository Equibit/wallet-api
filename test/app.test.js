'use strict'

const assert = require('assert')
const rp = require('request-promise')
require('../test-utils/setup')

describe('Feathers application tests', function () {
  it('starts and shows the index page', function (done) {
    rp('http://localhost:3030').then(body => {
      assert.ok(body.indexOf('<html>') !== -1)
      // setTimeout(() => {
      done()
      // }, 1000)
    })
  })

  describe('404', function () {
    it('shows a 404 HTML page', function () {
      return rp({
        url: 'http://localhost:3030/path/to/nowhere',
        headers: {
          'Accept': 'text/html'
        }
      }).catch(res => {
        assert.equal(res.statusCode, 404)
        assert.ok(res.error.indexOf('<html>') !== -1)
      })
    })

    it('shows a 404 JSON error without stack trace', function () {
      return rp({
        url: 'http://localhost:3030/path/to/nowhere',
        json: true
      }).catch(res => {
        assert.equal(res.statusCode, 404)
        assert.equal(res.error.code, 404)
        assert.equal(res.error.message, 'Page not found')
        assert.equal(res.error.name, 'NotFound')
      })
    })
  })
})
