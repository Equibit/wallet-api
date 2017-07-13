const assert = require('assert')
const app = require('../../../test-utils/clients').rest()
const getNextIndex = require('../../../src/services/portfolios/hook.get-next-index')()
const memory = require('feathers-memory')

app.service('portfolios', memory())

describe('Portfolio Service - getNextIndex Hook', function () {
  describe('No Existing Portfolios', function () {
    it('returns the correct index', function (done) {
      const context = {
        service: app.service('portfolios'),
        data: { name: 'My Portfolio' }
      }

      getNextIndex(context)
        .then(context => {
          assert(context.data.index === 1, 'correct index of 1 was returned')
          done()
        })
        .catch(error => {
          assert(!error, 'should have been able to get an index')
          done()
        })
    })
  })

  describe('Existing Portfolios', function () {
    before(function () {
      app.service('portfolios', memory({
        store: {
          1: { name: 'Portfolio One', index: 1 },
          2: { name: 'Portfolio Two', index: 2 }
        }
      }))
    })

    it('returns the correct index', function (done) {
      const context = {
        service: app.service('portfolios'),
        data: { name: 'My Portfolio' }
      }

      getNextIndex(context)
        .then(context => {
          assert(context.data.index === 3, 'correct index of 3 was returned')
          done()
        })
        .catch(error => {
          assert(!error, 'should have been able to get an index')
          done()
        })
    })
  })
})
