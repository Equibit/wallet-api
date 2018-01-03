const assert = require('assert')
const app = require('../../../../test-utils/clients').rest()
const getNextIndex = require('./hook.get-next-index')()
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
          assert.equal(context.data.index, 0, 'correct index of 0 was returned')
          done()
        })
        .catch(error => {
          console.log('ERROR here', error)
          assert(!error, 'should have been able to get an index')
          done()
        })
    })
  })

  describe('Existing Portfolios', function () {
    before(function () {
      app.service('portfolios', memory({
        store: {
          0: { userId: 0, name: 'Portfolio One', index: 0 },
          1: { userId: 0, name: 'Portfolio Two', index: 1 }
        }
      }))
    })

    it('returns the correct index', function (done) {
      const context = {
        service: app.service('portfolios'),
        data: { name: 'My Portfolio', userId: 0 }
      }

      getNextIndex(context)
        .then(context => {
          assert.equal(context.data.index, 2, 'should return index of 2')
          done()
        })
        .catch(error => {
          console.log('ERROR', error)
          assert(!error, 'should have been able to get an index')
          done()
        })
    })
  })
})
