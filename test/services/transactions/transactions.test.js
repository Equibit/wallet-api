const assert = require('assert')
const app = require('../../../src/app')
require('../../../test-utils/setup')
const txnUtils = require('../../../test-utils/transactions')
const clients = require('../../../test-utils/make-clients')
const removeUsers = require('../../../test-utils/utils').removeUsers
const { authenticate } = require('../../../test-utils/user')
const assertRequiresAuth = require('../../../test-utils/method.require-auth')

txnUtils.mock()

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('transactions')

  describe(`Transaction Service Tests - ${transport}`, function () {
    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: 'test@equibit.org' }))
        .then(() => app.service('/users').create({ email: 'test2@equibit.org' }))
        .then(user => app.service('/users').find({ query: {} }))
        .then(users => {
          users = users.data || users
          this.user = users[0]
          this.user2 = users[1]
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    afterEach(function (done) {
      // Remove all users after tests run.
      feathersClient.logout()
        .then(() => app.service('/users').remove(null, {}))
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    describe('Client Without Auth', function () {
      it(`requires auth for find requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'find', done)
      })

      it(`requires auth for get requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'get', done)
      })

      it(`requires auth for create requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'create', done)
      })

      it(`requires auth for update requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'update', done)
      })

      it(`requires auth for patch requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'patch', done)
      })

      it(`requires auth for remove requests from the client`, function (done) {
        assertRequiresAuth(serviceOnClient, 'remove', done)
      })
    })

    describe('Client With Auth', function () {
      it.skip('allows find', function () {
        return app.service('users').create({ email: 'ADMIN@EQUIBIT.ORG' })
          .then(user => {
            assert(user.email === 'admin@equibit.org', 'the signup email was lowerCased')
          })
      })

      it.skip(`maps update to patch`, function (done) {})

      it(`records the transaction in the core as a before hook`, function (done) {
        const user = this.user

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.create({
              address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
              addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
              addressVout: 0,
              type: 'out',
              currencyType: 'BTC',
              toAddress: '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z',
              amount: 777,
              hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
            })
          })
          .then(response => {
            assert(response, 'the core responded with success')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it.skip(`does not record the transaction in the database if the core rejects it`, function (done) {
        const user = this.user

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.create({
              address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
              type: 'BTC',
              hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
            })
          })
          .then(response => {
            assert(response, 'the core responded with success')
            done()
          })
          .catch(error => {
            assert(!error, `should have been able to authenticate`)
            done()
          })
      })

      it('sends notifications to sockets with matching addresses', function (done) {
        if (transport === 'feathers-rest') {
          return done()
        }
        const user = this.user

        const handler = function (transaction) {
          assert(transaction, 'received a transation created notification')
          console.log(app.io.sockets.sockets)
          feathersClient.service('transactions').off('created', handler)
          done()
        }
        feathersClient.service('transactions').on('created', handler)

        authenticate(app, feathersClient, user)
          .then(response => {
            return feathersClient.service('subscribe')
              .create({addresses: ['mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32']})
          })
          .then(response => {
            return serviceOnClient.create({
              address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
              addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
              addressVout: 0,
              type: 'out',
              currencyType: 'BTC',
              toAddress: '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z',
              amount: 777,
              hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
            })
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it.skip('retrieves records by address', function (done) {})

      it.skip('retrieves records by txnId', function (done) {})

      it.skip('requires companyName and issuanceName if type === EQB', function (done) {})

      it.skip('only allows the creator to update the description', function (done) {})
    })
  })
}
