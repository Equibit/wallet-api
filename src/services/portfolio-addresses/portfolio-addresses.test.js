const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const { clients } = require('../../../test-utils/index')
const userUtils = require('../../../test-utils/users')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')

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
      const index = ~~(Math.random() * 1000)
      it('can create a portfolio address', function (done) {
        const data = {
          portfolioId: '5a3d5de27f4c2a5832bdf420',
          index,
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

      it('returns original record on duplicate create of a portfolio address', function (done) {
        const data = {
          portfolioId: '5a3d5de27f4c2a5832bdf420',
          index,
          type: 'EQB', // EQB or BTC
          isChange: false,
          isUsed: false
        }

        serviceOnServer.find({ query: data })
          .then(findResponse => {
            serviceOnServer.create(data)
              .then(createResponse => {
                assert.equal(createResponse._id.toString(), findResponse.data[0]._id.toString(), '_id is correct')
                done()
              })
              .catch(done)
          })
          .catch(done)
      })

      it('returns the same single record on rapid duplicate create of a portfolio address', function (done) {
        const data = {
          portfolioId: '5a3d5de27f4c2a5832bdf420',
          index,
          type: 'BTC', // EQB or BTC
          isChange: true,
          isUsed: false
        }

        Promise.all([
          serviceOnServer.create(data),
          serviceOnServer.create(data),
          serviceOnServer.create(data),
          serviceOnServer.create(data)
        ]).then(responses => {
          assert.equal(responses.length, 4, 'returned 4 responses')
          assert.equal(responses[0]._id.toString(), responses[1]._id.toString(), 'first two are the same')
          assert.equal(responses[2]._id.toString(), responses[3]._id.toString(), 'last two are the same')
          assert.equal(responses[0]._id.toString(), responses[3]._id.toString(), 'all are the same')
          done()
        }).catch(done)
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
      return userUtils.removeAll(app)
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

      describe('Cannot patch multiple', function () {
        it('requires id', function (done) {
          const user = this.user

          userUtils.authenticateTemp(app, feathersClient, user)
            .then(() => {
              serviceOnClient.patch(null, {})
                .then(() => {
                  done('should have errored')
                })
                .catch(err => {
                  assert(err, 'errors without id')
                  assert.equal(err.message, 'id must be specified', 'correct error')
                  done()
                })
            })
            .catch(done)
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

      describe('Cannot remove', function () {
        it.only('requires id', function (done) {
          const user = this.user

          userUtils.authenticateTemp(app, feathersClient, user)
          .then(() =>
            serviceOnClient.remove({id: 'placeholder'})
          )
          .then(() => {
            done('should have errored')
          })
          .catch(err => {
            assert(err, 'causes an error')
            assert(err.message.indexOf('disallow') >= 0, 'correct error')
            done()
          })
          .catch(done)
        })
      })
    })
  })
}
