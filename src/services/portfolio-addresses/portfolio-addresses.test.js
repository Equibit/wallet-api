const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const { clients } = require('../../../test-utils/index')
const userUtils = require('../../../test-utils/users')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')
const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']

const servicePath = 'portfolio-addresses'
const serviceOnServer = app.service(servicePath)

function assertCanPatch (service, itemId, data, done) {
  const id = typeof itemId === 'number' ? itemId : itemId.toString()
  return service.patch(id, data)
    .then(response => {
      Object.keys(data).forEach(item => {
        assert.deepEqual(response[item], data[item], `can patch ${item} attribute`)
      })
      done()
    })
    .catch(done)
}

function assertCannotPatch (service, itemId, data, errorClassName, errorMessage, done) {
  const id = typeof itemId === 'number' ? itemId : itemId.toString()
  return service.patch(id, data)
    .then(response => {
      const attributeToPatch = Object.keys(data)
      done(`should not have been able to patch ${attributeToPatch} attribute`)
    })
    .catch(error => {
      assert.equal(error.className, errorClassName, 'className should match')
      assert(error.message.includes(errorMessage), 'error message should match')
      done()
    })
    .catch(done)
}

describe(`${servicePath} Service`, function () {
  clients.forEach(client => {
    runTests(client)
  })

  describe(`${servicePath} - Server`, () => {
    it('registered the service', () => {
      assert.ok(serviceOnServer, 'Registered the service')
    })

    before(function () {
      return serviceOnServer.remove(null, {})
    })

    describe.skip('Find', function () {})
    describe.skip('Get', function () {})

    describe('Create', function () {
      it('can create a portfolio address', function (done) {
        const data = {
          portfolioId: '5a3d5de27f4c2a5832bdf420',
          index: ~~(Math.random() * 1000),
          type: 'EQB', // EQB or BTC
          isChange: false,
          isUsed: false
        }

        serviceOnServer.create(data)
          .then(response => {
            assert.equal(response.type, 'EQB', 'type is correct')
            assert.equal(response.isChange, false, 'isChange is correct')
            assert.equal(response.isUsed, false, 'isUsed is correct')
            done()
          })
          .catch(done)
      })
    })

    describe.skip('Update', function () {
      it('forwards to patch', function (done) {
        serviceOnServer.update('randomid', {})
          .then(response => {
            done()
          })
          .catch(done)
      })
    })

    describe('Patch', function () {
      describe('Can patch all fields', function () {
        const data = {
          // portfolioId: '5a3d5de27f4c2a5832bdf420',
          index: ~~(Math.random() * 1000),
          type: 'EQB', // EQB or BTC
          isChange: false,
          isUsed: false
        }
        const fields = Object.keys(data)

        fields.forEach(field => {
          it(field, function (done) {
            serviceOnServer.find({})
              .then(response => {
                const respDatas = Array.isArray(response.data) ? response.data : [response.data]
                const respData = respDatas[0]

                assertCanPatch(serviceOnServer, respData._id, { [field]: data[field] }, done)
              })
              .catch(done)
          })
        })
      })
    })

    describe('Remove', function () {
      it('allows deleting portfolio address', function (done) {
        serviceOnServer.find({})
          .then(response => {
            const someId = response.data[0]._id.toString()
            assert(someId, 'could find an id for testing further.')

            serviceOnServer.remove(someId)
              .then(response => {
                assert.equal(response._id.toString(), someId, 'removed it')
                done()
              })
              .catch(done)
          })
          .catch(done)
      })
    })
  })
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('portfolio-addresses')

  describe(`${servicePath} - ${transport} Transport`, function () {
    before(function () {
      return app.service('/users').remove(null, { query: { email: { $in: testEmails } } }) // Remove all users
    })

    beforeEach(function (done) {
      userUtils.create(app).then(user => {
        this.user = user
        done()
      })
    })

    afterEach(function (done) {
      feathersClient.logout()
        .then(() => userUtils.removeAll(app))
        .then(() => app.service('portfolio-addresses').remove(null, {}))
        .then(() => app.service('portfolios').remove(null, {}))
        .then(() => done())
    })

    it('registered the service', function () {
      const service = app.service('portfolio-addresses')

      assert.ok(service, 'Registered the service')
    })

    describe('Client Unauthenticated', function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          assertRequiresAuth(serviceOnClient, method)
        })
      })
    })

    describe('With Auth', function () {
      beforeEach(function (done) {
        // Remove all portfolios before each test.
        app.service('portfolios').remove(null, {})
          .then(response => {
            done()
          })
      })

      it('allows users to create a portfolio address', function (done) {
        const user = this.user
        const name = 'My Portfolio'
        const data = {
          portfolioId: null,
          index: ~~(Math.random() * 1000),
          type: 'EQB', // EQB or BTC
          isChange: false,
          isUsed: false
        }

        userUtils.authenticateTemp(app, feathersClient, user)
          .then(response => feathersClient.service('portfolios').create({ name }))
          .then(portfolio => {
            data.portfolioId = portfolio._id
            return serviceOnClient.create(data)
          })
          .then(portfolioAddress => {
            assert(portfolioAddress._id, 'has an id')
            assert.equal(portfolioAddress.portfolioId, data.portfolioId, 'has correct portfolioId')
            done()
          })
          .catch(error => {
            console.log('ERROR ', error)
            assert(!error, 'this error should not have occurred')
            done()
          })
      })

      describe('Can patch isUsed field', function () {
        const patchData = {
          isUsed: true
        }
        const fields = Object.keys(patchData)

        fields.forEach(field => {
          it(field, function (done) {
            const user = this.user
            const name = 'My Portfolio'
            const data = {
              portfolioId: null,
              index: ~~(Math.random() * 1000),
              type: 'EQB', // EQB or BTC
              isChange: false,
              isUsed: false
            }

            userUtils.authenticateTemp(app, feathersClient, user)
              .then(response => feathersClient.service('portfolios').create({ name }))
              .then(portfolio => {
                data.portfolioId = portfolio._id
                return serviceOnClient.create(data)
              })
              .then(portfolioAddress => {
                assertCanPatch(serviceOnClient, portfolioAddress._id, { [field]: patchData[field] }, done)
              })
              .catch(done)
          })
        })
      })

      describe('Cannot patch any other fields', function () {
        const patchData = {
          portfolioId: 'nope',
          index: ~~(Math.random() * 1000),
          type: 'EQB', // EQB or BTC
          isChange: false
        }
        const fields = Object.keys(patchData)

        fields.forEach(field => {
          it(field, function (done) {
            const user = this.user
            const name = 'My Portfolio'
            const data = {
              portfolioId: null,
              index: ~~(Math.random() * 1000),
              type: 'EQB', // EQB or BTC
              isChange: false,
              isUsed: false
            }

            userUtils.authenticateTemp(app, feathersClient, user)
              .then(response => feathersClient.service('portfolios').create({ name }))
              .then(portfolio => {
                data.portfolioId = portfolio._id
                return serviceOnClient.create(data)
              })
              .then(portfolioAddress => {
                assertCannotPatch(
                  serviceOnClient,
                  portfolioAddress._id,
                  { [field]: patchData[field] },
                  'bad-request',
                  'may not be patched',
                  done
                )
              })
              .catch(done)
          })
        })
      })
    })
  })
}
