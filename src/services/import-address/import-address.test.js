const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const { clients, transactions } = require('../../../test-utils/index')
const userUtils = require('../../../test-utils/users')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')

const servicePath = 'import-address'
const serviceOnServer = app.service(servicePath)

describe(`${servicePath} Service`, function () {
  clients.forEach(client => {
    runTests(client)
  })

  describe(`${servicePath} - Server`, () => {
    it('registered the service', () => {
      assert.ok(serviceOnServer, 'Registered the service')
    })

    describe.skip('Find', function () {})
    describe.skip('Get', function () {})
    describe.skip('Create', function () {})
    describe.skip('Update', function () {})
    describe.skip('Patch', function () {})
    describe.skip('Remove', function () {})
  })
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('import-address')

  describe(`${servicePath} - ${transport} Transport`, function () {
    before(function () {
      return userUtils.removeAll(app)
    })

    beforeEach(function (done) {
      userUtils.create(app)
      .then(user => {
        this.user = user
        done()
      })
    })

    afterEach(function (done) {
      feathersClient.logout()
        .then(() => userUtils.removeAll(app))
        .then(() => done())
    })

    describe('Client Unauthenticated', function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          assertRequiresAuth(serviceOnClient, method)
        })
      })
    })

    describe(`${servicePath} - Authenticated Client`, function () {
      beforeEach(function () {
        transactions.setupMock()
      })
      afterEach(function () {
        transactions.resetMock()
      })
      it('allows create method', function (done) {
        const user = this.user
        const data = {
          address: 'mkQ2NFPHVBBHNbCKmcafjoXztEsfdtT2RU',
          type: 'EQB' // EQB or BTC
        }

        userUtils.authenticateTemp(app, feathersClient, user)
          .then(() => {
            return serviceOnClient.create(data)
          })
          .then(response => {
            assert(response, 'got a response')
            assert.equal(response.error, null, 'successful')
            done()
          })
          .catch(error => {
            console.log('ERROR ', error)
            assert(!error, 'this error should not have occurred')
            done()
          })
      })
    })
  })
}
