const assert = require('assert')
const app = require('../src/app')
// const makeSigned = require('feathers-authentication-signed/client')
// const crypto = require('crypto')
require('../test-utils/setup')
const clients = require('../test-utils/make-clients')
const removeUsers = require('../test-utils/utils').removeUsers

// Remove all users before all tests run.
before(removeUsers(app))

clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'

  describe(`______ Service Tests - ${transport}`, function () {
    it('________', function () {
      return app.service('users').create({ email: 'ADMIN@EQUIBIT.ORG' })
        .then(user => {
          assert(user.email === 'admin@equibit.org', 'the signup email was lowerCased')
        })
    })
  })
}
