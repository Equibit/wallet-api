const assert = require('assert')
const testHook = require('./hook.filter-userid-field.js')

const user1Order = Object.freeze({
  userId: '000000000000000000000000',
  type: 'SELL',
  status: 'OPEN'
})

const user2Order = Object.freeze({
  userId: '000000000000000000000001',
  type: 'BUY',
  status: 'OPEN'
})

const params = Object.freeze({
  authenticated: true,
  user: {
    _id: '000000000000000000000000'
  }
})

describe('Hook: Filter UserId Field', function (done) {
  describe('Find: ', function (done) {
    before(function () {
      this.context = {
        params: {},
        type: 'after',
        method: 'find'
      }
    })

    beforeEach(function () {
      this.user1Order = Object.assign({}, user1Order)
      this.user2Order = Object.assign({}, user2Order)
    })

    it('Should remove userIds for non-authenticated user', function (done) {
      const nonAuthContext = Object.assign({}, this.context, {result: {data: [this.user1Order, this.user2Order]}})
      testHook()(nonAuthContext).then(context => {
        context.result.data.forEach(order => assert.ok(!('userId' in order)))
        done()
      })
      .catch(done)
    })

    it('Should filter out the userId that does not belong to the user', function () {
      const authContext = Object.assign({}, this.context, {result: {data: [this.user1Order, this.user2Order]}, params: params})

      testHook()(authContext).then(context => {
        const filteredData = context.result.data
        assert.equal(filteredData[0].userId, '000000000000000000000000')
        assert.ok(!context.result.userId)
        done()
      })
      .catch(done)
    })
  })

  describe('Get: ', function (done) {
    before(function () {
      this.context = {
        params: {},
        type: 'after',
        method: 'get'
      }
    })

    beforeEach(function () {
      this.user1Order = Object.assign({}, user1Order)
      this.user2Order = Object.assign({}, user2Order)
    })

    it('Should remove userIds for non-authenticated user', function (done) {
      const nonAuthContext = Object.assign({}, this.context, {result: this.user1Order})

      testHook()(nonAuthContext).then(context => {
        assert.ok(!('userId' in context.result))
        done()
      })
      .catch(done)
    })

    it('Should filter out the userId that does not belong to the user', function (done) {
      const authContext = Object.assign({}, this.context, {params: params, result: this.user2Order})

      testHook()(authContext).then(context => {
        assert.ok(!context.result.userId)
        done()
      })
      .catch(done)
    })
  })
})
