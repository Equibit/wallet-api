const assert = require('assert')
const crypto = require('crypto')
const app = require('../src/app')
const makeSigned = require('feathers-authentication-signed/client')
const decode = require('jwt-decode')
require('../test-utils/setup')
const clients = require('../test-utils/make-clients')
const removeUsers = require('../test-utils/utils').removeUsers

const signed = makeSigned(crypto)

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`Authentication tests - ${transport}`, function () {
    beforeEach(function (done) {
      feathersClient.logout()
        .then(() => app.service('/users').create({ email: 'test@equibit.org' }))
        .then(user => app.service('/users').find({ query: {} }))
        .then(users => {
          users = users.data || users
          this.user = users[0]
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

    it('requires an email for the challenge-request auth strategy', function (done) {
      feathersClient.authenticate({
        strategy: 'challenge-request',
        signature: 'test'
      }).catch(error => {
        assert(error.code === 400)
        assert(error.message === 'Missing credentials')
        done()
      })
    })

    it('requires a signature for the challenge-request auth strategy', function (done) {
      const user = this.user
      const { email } = user
      feathersClient.authenticate({
        strategy: 'challenge-request',
        email
      }).catch(error => {
        assert(error.code === 400)
        assert(error.message === 'Missing credentials')
        done()
      })
    })

    it('allows user to login with temporary password', function (done) {
      const user = this.user
      const { email } = user
      const plainPassword = 'b67c67a3c3725b40'
      const hashedPassword = signed.createHash(plainPassword)
      // Patch the user with a known-to-be-working password/salt combo.
      app.service('/users').patch(user._id, {
        tempPassword: '9a17fb0204450fe5ca46645636ca60eb516d098b54f65c36ddaed0182666fe06e3ce6526f10c95c816bdb1291a04aa8b7090cefac9cf09fa2f9ddcd19f3e351b37d1a36ff604d9279f19098c212d04e2fcb56ea4f5208dba19e2785a3b3e03b81f9fb3719be809e6d02539c0916568576b9b0012c04fea68323b761f04b57dd16aa1980b8a40a7e41dafeb5f0f9ad7f5a499baef5aa447aeac6546c324b82b65af92cef858cc2660331aadfd9027176bf2f3cfd3c3b75b9d897c2d3cca3136ddb927cddaf4805bafaed4996a3e8f31ac5b1f0deb4d9892c373bf5c9d175180f87cf94e59294149ee482bc987ae5fd436dafe420fe5a0b4e0e68d4e7a44e4e2a3619c3bb6592d83210bc0204e004e3ba105b7d69d54d8d21d2c9a908f62fac665666c2354933bc08ed0a5d8ece22bb564cb96c47d5f0a330503d4644266b16938abf132472c19aad614609772ebf7300c93716dcd69f7247c65bf7f57383bcfffdf534c54e8bb9aded560a3a6e1925a1e1d1bf0ab216fe3238c1ed278c867fc3d90143a2a96727195926fdddf8043f39139ae56b707b2146f7c0d823582392ed6e49f3049f6022b0f1581a393b7d2dc899d7def4ef2d52e67b393d080f92d60f77c258e4a16ab8f8b45972f452db3c43a50837ee24363f0d26290b6c1f454305ea42387b0877203007050a55bac268edb948e4b25bfd3f478d2afbdf230145e86',
        salt: 'dcbce6bb0e625e18f9b6'
      }).then(user => {
        const data = { email }
        return signed.sign(data, hashedPassword)
      }).then(({email, signature}) => {
        return feathersClient.authenticate({
          strategy: 'challenge-request',
          email,
          signature
        })
      }).then(({challenge, salt}) => {
        return signed.generateSecret(hashedPassword, salt).then(secret => {
          // The secret is the same as the stored password, but it
          // never gets sent across the wire.
          let data = {email, challenge}
          return signed.sign(data, secret)
        })
      }).then(signedData => {
        signedData.strategy = 'challenge'
        return feathersClient.authenticate(signedData)
      }).then(({ accessToken, user, usingTempPassword }) => {
        assert(accessToken, 'got back an accessToken')

        const payload = decode(accessToken)

        const allowedPayloadFields = [
          'aud',
          'exp',
          'iat',
          'iss',
          'sub',
          'userId'
        ]
        Object.keys(payload).forEach(field => {
          assert(allowedPayloadFields.includes(field), `the "${field}" claim was included in the jwt payload`)
        })
        assert(payload.aud === 'https://equibit.org', 'the jwt audience was correct')
        assert(payload.iss === 'Equibit', 'the jwt issuer was correct')
        assert(payload.sub === 'user', 'the jwt subject was correct')
        assert(payload.userId === user._id, 'the jwt userId was correct')

        const allowedUserFields = [
          '_id',
          'email',
          'createdAt',
          'updatedAt',
          'isNewUser'
        ]
        Object.keys(user).forEach(field => {
          assert(allowedUserFields.includes(field), `the "${field}" field was returned in the user object`)
        })
        assert(user.email, `the user's email was returned`)
        assert(user.createdAt, `the user record's createdAt timestamp was included in the response`)
        assert(user.updatedAt, `the user record's updatedAt timestamp was included in the response`)
        assert(user.isNewUser, 'the user was flagged as a new user')

        assert(usingTempPassword, 'the response included the usingTempPassword flag')

        done()
      }).catch(error => {
        console.log(error)
        assert(!error, 'this error should not have occurred')
        done()
      })
    })

    it('allows user to login with a real password', function (done) {
      const user = this.user
      const { email } = user
      const plainPassword = 'b67c67a3c3725b40'
      const hashedPassword = signed.createHash(plainPassword)
      // Patch the user with a known-to-be-working password/salt combo.
      app.service('/users').patch(user._id, {
        tempPassword: undefined,
        password: hashedPassword
      }, { user }).then(user => {
        assert(user.isNewUser === false, 'the user is no longer flagged as new')

        const data = { email }
        return signed.sign(data, hashedPassword)
      }).then(({email, signature}) => {
        return feathersClient.authenticate({
          strategy: 'challenge-request',
          email,
          signature
        })
      }).then(({challenge, salt}) => {
        return signed.generateSecret(hashedPassword, salt).then(secret => {
          // The secret is the same as the stored password, but it
          // never gets sent across the wire.
          let data = {email, challenge}
          return signed.sign(data, secret)
        })
      }).then(signedData => {
        signedData.strategy = 'challenge'
        return feathersClient.authenticate(signedData)
      }).then(({ accessToken, user, usingTempPassword }) => {
        assert(accessToken, 'got back an accessToken')

        const payload = decode(accessToken)

        const allowedPayloadFields = [
          'aud',
          'exp',
          'iat',
          'iss',
          'sub',
          'userId'
        ]
        Object.keys(payload).forEach(field => {
          assert(allowedPayloadFields.includes(field), `the "${field}" claim was included in the jwt payload`)
        })
        assert(payload.aud === 'https://equibit.org', 'the jwt audience was correct')
        assert(payload.iss === 'Equibit', 'the jwt issuer was correct')
        assert(payload.sub === 'user', 'the jwt subject was correct')
        assert(payload.userId === user._id, 'the jwt userId was correct')

        const allowedUserFields = [
          '_id',
          'email',
          'createdAt',
          'updatedAt',
          'isNewUser'
        ]
        Object.keys(user).forEach(field => {
          assert(allowedUserFields.includes(field), `the "${field}" field was returned in the user object`)
        })
        assert(user.email, `the user's email was returned`)
        assert(user.createdAt, `the user record's createdAt timestamp was included in the response`)
        assert(user.updatedAt, `the user record's updatedAt timestamp was included in the response`)
        assert(!user.isNewUser, 'the user is not flagged as a new user')

        assert(!usingTempPassword, 'the response did not include the usingTempPassword flag')

        done()
      }).catch(error => {
        console.log(error)
        assert(!error, 'this error should not have occurred')
        done()
      })
    })

    it('requires signature for challenge strategy', function (done) {
      const user = this.user
      const { email } = user
      const plainPassword = 'b67c67a3c3725b40'
      const hashedPassword = signed.createHash(plainPassword)
      // Patch the user with a new password
      app.service('/users').patch(user._id, { tempPassword: undefined, password: hashedPassword }, { user })
        .then(user => signed.sign({ email }, hashedPassword))
        .then(({email, signature}) => feathersClient.authenticate({strategy: 'challenge-request', email, signature}))
        .then(({challenge, salt}) => {
          return signed.generateSecret(hashedPassword, salt).then(secret => {
            return signed.sign({email, challenge}, secret)
          })
        })
        .then(signedData => {
          signedData.strategy = 'challenge'
          delete signedData.signature
          return feathersClient.authenticate(signedData)
        })
        .catch(error => {
          assert(error.code === 400)
          assert(error.message === 'Missing credentials')
          done()
        })
    })

    it('requires email for challenge strategy', function (done) {
      const user = this.user
      const { email } = user
      const plainPassword = 'b67c67a3c3725b40'
      const hashedPassword = signed.createHash(plainPassword)
      // Patch the user with a new password
      app.service('/users').patch(user._id, { tempPassword: undefined, password: hashedPassword }, { user })
        .then(user => signed.sign({ email }, hashedPassword))
        .then(({email, signature}) => feathersClient.authenticate({strategy: 'challenge-request', email, signature}))
        .then(({challenge, salt}) => {
          return signed.generateSecret(hashedPassword, salt).then(secret => {
            return signed.sign({challenge}, secret)
          })
        })
        .then(signedData => {
          signedData.strategy = 'challenge'
          return feathersClient.authenticate(signedData)
        })
        .catch(error => {
          assert(error.code === 400)
          assert(error.message === 'Missing credentials')
          done()
        })
    })

    it('requires challenge in the challenge strategy signature', function (done) {
      const user = this.user
      const { email } = user
      const plainPassword = 'b67c67a3c3725b40'
      const hashedPassword = signed.createHash(plainPassword)
      // Patch the user with a new password
      app.service('/users').patch(user._id, { tempPassword: undefined, password: hashedPassword }, { user })
        .then(user => signed.sign({ email }, hashedPassword))
        .then(({email, signature}) => feathersClient.authenticate({strategy: 'challenge-request', email, signature}))
        .then(({challenge, salt}) => {
          return signed.generateSecret(hashedPassword, salt).then(secret => {
            // the challenge is missing from the signature, so login should fail
            return signed.sign({email}, secret)
          })
        })
        .then(signedData => {
          signedData.strategy = 'challenge'
          return feathersClient.authenticate(signedData)
        })
        .catch(error => {
          assert(error.code === 401)
          assert(error.message === 'invalid login')
          done()
        })
    })

    // it(`doesn't accept temporary passwords after 15 minutes`, function () {

    // })
  })
};
