const assert = require('assert')
const app = require('../../app')
require('../../../test-utils/setup')
const txnUtils = require('../../../test-utils/transactions')
const { clients } = require('../../../test-utils/index')
const { authenticate } = require('../../../test-utils/users')
const assertRequiresAuth = require('../../../test-utils/assert/requires-auth')

const service = '/transactions'
const dummyTransaction = {
  address: 'mwmTx2oTzkbQg9spp6F5ExFVeibXwwHF32',
  addressTxid: '2ac0daff49a4ff82a35a4864797f99f23c396b0529c5ba1e04b3d7b97521feba',
  addressVout: 0,
  type: 'out',
  currencyType: 'BTC',
  toAddress: '1A6Ei5cRfDJ8jjhwxfzLJph8B9ZEthR9Z',
  amount: 777123,
  fee: 0.0001,
  hex: `01000000012c6e7e8499a362e611b7cf3c50f55ea67528275cce4540e224cdd9265cf207a4010000006a4730440220299bb9f6493d2ab0dd9aad9123252d5f718618403bb19d77699f21cf732bb9c602201b5adcbcaf619c2c5ca43274b3362778bc70d09091d2447333990ebd4aff8f8a0121033701fc7f242ae2dd63a18753518b6d1425e53496878924b6c0dc08d800af46adffffffff0200a3e111000000001976a914ea3f916f7ad64b1ed044147d4b1df2af10ea9cb688ac98ecfa02000000001976a914b0abfca92c8a1ae023220d4134fe72ff3273a30988ac00000000`
}
const testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com']

describe(`${service} Service`, function () {
  clients.forEach(client => {
    runTests(client)
  })
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('transactions')

  describe(`${service} - ${transport} Transport`, function () {
    before(function () {
      return app.service('/users').remove(null, { query: { email: { $in: testEmails } } })
    })
    after(function () {
      return Promise.all([
        app.service('/users').remove(null, { query: { email: { $in: testEmails } } }),
        app.service('/login-attempts').remove(null, {}),
        app.service('/transactions').remove(null, { query: { amount: dummyTransaction.amount } })
      ])
    })

    beforeEach(function (done) {
      txnUtils.setupMock()
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: testEmails[0] }))
        .then(() => app.service('/users').create({ email: testEmails[1] }))
        .then(user => app.service('/users').find({ query: { email: { $in: testEmails } } }))
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
      txnUtils.resetMock()
      // Remove all users after tests run.
      feathersClient.logout()
        .then(() => app.service('/users').remove(null, { query: { email: { $in: testEmails } } }))
        .then(() => {
          done()
        })
        .catch(error => {
          console.log(error)
        })
    })

    describe('Client Unauthenticated', function () {
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        it(`requires auth on ${method}`, function () {
          assertRequiresAuth(serviceOnClient, method)
        })
      })
    })

    describe('Client With Auth', function () {
      it.skip('allows find', function () {
        return app.service('users').create({ email: testEmails[0] })
          .then(user => {
            assert(user.email === 'test@equibitgroup.com', 'the signup email was lowerCased')
          })
      })

      it.skip(`maps update to patch`, function (done) {})

      it(`records the transaction in the core as a before hook`, function (done) {
        const user = this.user

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.create(dummyTransaction)
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

      describe('Events', function () {
        beforeEach(function () {
          return app.service('address-map').remove(null, {})
        })

        it('sends notifications to sockets with matching addresses', function (done) {
          if (transport === 'feathers-rest') {
            return done()
          }
          const user = this.user

          const handler = function (transaction) {
            assert(transaction, 'received a transation created notification')
            // console.log(app.io.sockets.sockets)
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
              return serviceOnClient.create(dummyTransaction)
            })
            .catch(error => {
              assert(!error, error.message)
              done()
            })
        })
      })

      it('throws an error for find without address', function (done) {
        const user = this.user

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.find({ query: {} })
          })
          .then(response => {
            assert(!response, 'cannot query txns without passing address')
            done()
          })
          .catch(error => {
            assert(error.className === 'bad-request', 'got back an error')
            done()
          })
      })

      it('throws an error for find without `address.$in` length', function (done) {
        const user = this.user

        authenticate(app, feathersClient, user)
          .then(response => {
            return serviceOnClient.find({ query: { address: {$in: []} } })
          })
          .then(response => {
            assert(!response, 'cannot query txns without passing address')
            done()
          })
          .catch(error => {
            assert(error.className === 'bad-request', 'got back an error')
            done()
          })
      })

      it.skip('retrieves records by address', function (done) {})

      it.skip('retrieves records by txnId', function (done) {})

      it.skip('requires companyName and issuanceName if type === EQB', function (done) {})

      it.skip('only allows the creator to update the description', function (done) {})

      it('updates related issuance.sharesIssued for cancel type transactions', function (done) {
        const issuanceServiceOnServer = app.service('issuances')
        const initialSharesIssued = 222
        const transactionAmount = 22

        const issuanceCreateData = {
          userId: this.user._id.toString(),
          index: 0,
          companyIndex: 0,
          issuanceTxId: '000000000000000000000000',
          issuanceAddress: '000000000000000000000000',
          companyId: '000000000000000000000000',
          companyName: '000000000000000000000000',
          companySlug: '000000000000000000000000',
          domicile: '000000000000000000000000',
          issuanceName: '000000000000000000000000',
          issuanceType: '000000000000000000000000',
          sharesIssued: initialSharesIssued
        }
        authenticate(app, feathersClient, this.user)
          .then(loggedInResponse => {
            issuanceServiceOnServer.create(issuanceCreateData).then(issuance => {
              const issuanceId = issuance._id.toString()
              assert(issuanceId, 'issuance created')
              assert.equal(issuance.sharesIssued, initialSharesIssued, 'issuance created correctly')

              const createData = Object.assign({}, dummyTransaction)
              createData.issuanceId = issuanceId
              createData.type = 'CANCEL'
              createData.amount = transactionAmount

              serviceOnClient.create(createData)
                .then(transaction => {
                  assert.equal(transaction.type, 'CANCEL')
                  return issuanceServiceOnServer.find({ query: { _id: issuanceId } })
                })
                .then(findResponse => {
                  const issuanceUpdated = findResponse.data[0]
                  assert.equal(issuanceUpdated.sharesIssued, initialSharesIssued - transactionAmount, 'sharesIssued was updated correctly')
                  done()
                })
                .catch(done)
            })
          })
          .catch(done)
      })
    })
  })
}
