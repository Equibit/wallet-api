const makeSigned = require('feathers-authentication-signed/client')
const crypto = require('crypto')

const signed = makeSigned(crypto)

exports.create = function createUser (app, userIndex) {
  const index = userIndex || 0
  return app.service('/users').create({ email: exports.testEmails[index] })
    .then(user => app.service('/users').find({ query: { email: exports.testEmails[index] } }))
    .then(users => {
      users = users.data || users
      return users[0]
    })
}

exports.removeAll = function remove (app) {
  return app.service('/users').remove(null, { query: { email: { $in: exports.testEmails } } })
}

// Reminder: call feathersClient.logout after your test is over.
exports.authenticateTemp = function authenticateTempUser (app, feathersClient, user) {
  const { email } = user
  const plainPassword = 'b67c67a3c3725b40'
  const hashedPassword = signed.createHash(plainPassword)

  // Patch the user with a working password combo.
  return app.service('/users')
    .patch(user._id, {
      tempPassword: '9a17fb0204450fe5ca46645636ca60eb516d098b54f65c36ddaed0182666fe06e3ce6526f10c95c816bdb1291a04aa8b7090cefac9cf09fa2f9ddcd19f3e351b37d1a36ff604d9279f19098c212d04e2fcb56ea4f5208dba19e2785a3b3e03b81f9fb3719be809e6d02539c0916568576b9b0012c04fea68323b761f04b57dd16aa1980b8a40a7e41dafeb5f0f9ad7f5a499baef5aa447aeac6546c324b82b65af92cef858cc2660331aadfd9027176bf2f3cfd3c3b75b9d897c2d3cca3136ddb927cddaf4805bafaed4996a3e8f31ac5b1f0deb4d9892c373bf5c9d175180f87cf94e59294149ee482bc987ae5fd436dafe420fe5a0b4e0e68d4e7a44e4e2a3619c3bb6592d83210bc0204e004e3ba105b7d69d54d8d21d2c9a908f62fac665666c2354933bc08ed0a5d8ece22bb564cb96c47d5f0a330503d4644266b16938abf132472c19aad614609772ebf7300c93716dcd69f7247c65bf7f57383bcfffdf534c54e8bb9aded560a3a6e1925a1e1d1bf0ab216fe3238c1ed278c867fc3d90143a2a96727195926fdddf8043f39139ae56b707b2146f7c0d823582392ed6e49f3049f6022b0f1581a393b7d2dc899d7def4ef2d52e67b393d080f92d60f77c258e4a16ab8f8b45972f452db3c43a50837ee24363f0d26290b6c1f454305ea42387b0877203007050a55bac268edb948e4b25bfd3f478d2afbdf230145e86',
      salt: 'dcbce6bb0e625e18f9b6'
    })
    .then(user => {
      const data = { email }
      return signed.sign(data, hashedPassword)
    })
    .then(({email, signature}) => {
      return feathersClient.authenticate({
        strategy: 'challenge-request',
        email,
        signature
      })
    })
    .then(({challenge, salt}) => {
      return signed.generateSecret(hashedPassword, salt).then(secret => {
        // The secret is the same as the stored password, but it
        // never gets sent across the wire.
        let data = {email, challenge}
        return signed.sign(data, secret)
      })
    })
    .then(signedData => {
      signedData.strategy = 'challenge'
      return feathersClient.authenticate(signedData)
    })
}

// Reminder: call feathersClient.logout after your test is over.
exports.authenticate = function authenticateUser (app, feathersClient, user) {
  const { email } = user
  const hashedPassword = signed.createHash('b67c67a3c3725b40')

  return app.service('/users')
    .patch(user._id, { password: hashedPassword }, { user })
    .then(user => {
      return signed.sign({ email }, hashedPassword)
    })
    .then(({email, signature}) => {
      return feathersClient.authenticate({
        strategy: 'challenge-request',
        email,
        signature
      })
    })
    .then(({challenge, salt}) => signed.generateSecret(hashedPassword, salt)
      .then(secret => signed.sign({email, challenge}, secret)))
    .then(signedData => {
      signedData.strategy = 'challenge'
      return feathersClient.authenticate(signedData)
    })
}

exports.testEmails = ['test@equibitgroup.com', 'test2@equibitgroup.com', 'newtest@equibitgroup.com']
