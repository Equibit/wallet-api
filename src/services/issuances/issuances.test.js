const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const { clients, users: userUtils, transactions: txUtils } = utils
const ObjectId = require('objectid')

const servicePath = '/issuances'
const serviceOnServer = app.service(servicePath)

describe(`${servicePath} Service`, function () {
  clients.forEach(client => {
    runTests(client)
  })

  function runTests (feathersClient) {
    const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
    const serviceOnClient = feathersClient.service(servicePath)

    describe(`${servicePath} service -- ${transport}`, function () {
      beforeEach(function (done) {
        userUtils.create(app)
        .then(user => {
          this.user = user
          done()
        })
      })

      afterEach(function (done) {
        feathersClient.logout()
          .then(() => serviceOnServer.remove(null, { query: { userId: '000000000000000000000000' } }))
          .then(() => userUtils.removeAll(app))
          .then(() => txUtils.removeAll(app))
          .then(() => done())
      })

      it('sets issuanceTxId on transaction when created', function (done) {
        const txId = 'f9204f1a33a60436f19d36b49c81eae9b4f28aa82a51ed77c61c620c26aff02e'
        userUtils.authenticateTemp(app, feathersClient, this.user)
          .then(loggedInResponse => {
            return app.service('transactions').create({
              fromAddress: '000000000000000000000000',
              addressTxid: 'cded0727913e8c27779dae5e0ebe20e8230bd28ccaf296e2853535156631007a',
              addressVout: 1,
              type: 'AUTH',
              currencyType: 'EQB',
              toAddress: 'mw6nyP6jzF4dm9sBJvzE1uxBuVYbxN4ic5',
              amount: 1000000000,
              fee: 0.0001,
              txId,
              hex: `02000000017a00316615353585e296f2ca8cd20b23e820be0e5eae9d77278c3e` +
                   `912707edcd010000006a47304402207d54b7cb4dad146ed96e30b1d433ebb56b` +
                   `4473c45ad5d3cbbc99b6d74a58f97702206c957f9cb54974787fd89e53a3ae9a` +
                   `1b26819819d12304ba267111206603976c0121028a07051a74f23c9722590dae` +
                   `48262981c04d19305a43a25a964607882c30b114000000000200e1f505000000` +
                   `001976a914aaf03f764938b036c05957e1ded32608abde33aa88ac0000000000` +
                   `0000000000000000000000000000000000000000000000000000000000000000` +
                   `fd5a017b22636f6d70616e79223a7b22726567697374726174696f6e5f6e756d` +
                   `626572223a22383337373334303636373330222c226a7572697364696374696f` +
                   `6e5f636f756e747279223a225553222c226a7572697364696374696f6e5f7374` +
                   `6174655f6f725f70726f76696e6365223a2244656c6177617265222c226c6567` +
                   `616c5f6e616d65223a22566972696469616e2044796e616d696373227d2c2269` +
                   `737375616e6365223a7b2269737375616e63655f61646472657373223a226d77` +
                   `366e7950366a7a4634646d3973424a767a453175784275565962784e34696335` +
                   `222c2269737375616e63655f6e616d65223a2253656c66204d6963726f776176` +
                   `696e672050697a7a61222c2269737375616e63655f64617465223a3135323336` +
                   `34393633312c227265737472696374696f6e5f6c6576656c223a312c22736563` +
                   `75726974795f74797065223a22636f6d6d6f6e5f736861726573227d7d33df67` +
                   `00000000001976a9148f1709f1b5b7674b3c72a45100355afff136192488ac00` +
                   `0000000000000000000000000000000000000000000000000000000000000000` +
                   `000000000000000000`
            })
          })
          .then(tx => {
            return serviceOnClient.create({
              userId: this.user._id,
              index: 0,
              companyIndex: 0,
              issuanceTxId: txId,
              issuanceAddress: 'mw6nyP6jzF4dm9sBJvzE1uxBuVYbxN4ic5',

              companyId: new ObjectId(),
              companyName: 'Test company',
              companySlug: 'test-company',
              domicile: 'USA',
              issuanceName: 'Test issuance',
              issuanceType: 'common_shares',
              restriction: '0'
            })
          })
          .then(issuance => {
            const issuanceId = issuance._id
            return app.service('transactions').find({ query: { txId } })
              .then(result => {
                const tx = result.data[0]
                assert.equal(tx.issuanceId, issuanceId, 'issuanceId set on transaction')
                assert.equal(tx.issuanceUnit, 'SHARES', 'issuanceUnit set on transaction')
                assert.equal(tx.issuanceName, 'Test issuance', 'issuanceName set on transaction')
                assert.equal(tx.issuanceType, 'common_shares', 'issuanceType set on transaction')
              }).then(() => done())
          })
          .catch(done)
      })
    })
  }
})
