const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')

const servicePath = '/companies'
const serviceOnServer = app.service(servicePath)

describe(`${servicePath} Service`, function () {
  before(function () {
    app.service('login-attempts').remove(null, {})
      .then(response => app.service('companies').remove(null, {}))
      .then(response => app.service('users').remove(null, {}))
  })

  after(function () {
    app.service('login-attempts').remove(null, {})
      .then(response => app.service('companies').remove(null, {}))
      .then(response => app.service('users').remove(null, {}))
  })

  utils.clients.forEach(client => {
    runTests(client)
  })

  describe(`${servicePath} - Server`, function () {
    beforeEach(function () {
      return serviceOnServer.remove(null, {}) // Remove all records
    })

    describe('find', function () {
      it.skip('', function (done) {})
    })

    describe('get', function () {
      it.skip('', function (done) {})
    })

    describe('create', function () {
      it.skip('', function (done) {})
    })

    describe('update', function () {
      it.skip('', function (done) {})
    })

    describe('patch', function () {
      it.skip('', function (done) {})
    })

    describe('remove', function () {
      it.skip('', function (done) {})
    })
  })
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service(servicePath)

  describe(`${servicePath} - ${transport} Transport`, function () {
    before(function () {
      // Remove all users
      return app.service('/users').remove(null, {})
    })

    describe(`${servicePath} - Unauthenticated Client`, function () {
      const methods = ['create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it.skip(`requires auth on ${method}`, function () {
          return utils.assert.requiresAuth(serviceOnClient, method)
        })
      })

      describe('find', function () {
        it.skip('can find data', function (done) {})
      })

      describe('get', function () {
        it.skip('can get data', function (done) {})
      })
    })

    describe(`${servicePath} - Authenticated Client`, function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it.skip(`works with auth on ${method}`, function () {
          return utils.assert.requiresAuth(serviceOnClient, method)
        })
      })

      before(function () {
        return utils.users.create(app)
          .then(user => {
            return utils.users.authenticate(app, feathersClient, user)
              .then(response => {
                this.user = user
              })
          })
      })

      after(function () {
        return feathersClient.logout()
      })
      // describe('Grants Access to the Authenticated User', function () {})
      // describe('Protects Other Users\' Data', function () {})

      describe('Create', function () {
        it('slugifies the name property', function (done) {
          const newCompany = { name: 'This is a test' }

          serviceOnClient.create(newCompany)
            .then(company => {
              assert(company.slug === 'this-is-a-test', 'slug should match')
              done()
            })
            .catch(done)
        })

        it('assigns the current userId', function (done) {
          const user = this.user
          const newCompany = { name: 'Test' }

          serviceOnClient.create(newCompany)
            .then(company => {
              assert(company.userId.toString() === user._id.toString(), 'company and user should have the same userId')
              done()
            })
            .catch(done)
        })

        describe('Company Index', function () {
          before(function () {
            return serviceOnServer.remove(null, {})
          })

          after(function () {
            return serviceOnServer.remove(null, {})
          })

          it('first company has index of 0', function (done) {
            const newCompany = { name: 'Test' }

            serviceOnClient.create(newCompany)
              .then(company => {
                assert(company.index === 0, 'first index should be 0')
                done()
              })
              .catch(done)
          })

          it('second company has incremented index', function (done) {
            const newCompany = { name: 'Test2' }

            serviceOnClient.create(newCompany)
              .then(company => {
                assert(company.index === 1, `second index should be 1 instead of ${company.index}`)
                done()
              })
              .catch(done)
          })

          it('only increments for the current user', function (done) {
            serviceOnServer.create({
              name: 'Test5',
              userId: 'some-user-id'
            })
              .then(otherCompany => {
                const newCompany = { name: 'Test2' }

                serviceOnClient.create(newCompany)
                  .then(company => {
                    assert(company.index === 2, `second index should be 2 instead of ${company.index}`)
                    done()
                  })
              })
              .catch(done)
          })
        })
      })
    })
  })
}
