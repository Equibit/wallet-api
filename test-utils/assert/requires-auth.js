const assert = require('assert')
const args = {
  find: [{}],
  get: [1],
  create: [{ email: 'require-auth-test@feathersjs.com', test: true }],
  update: [1, { test: true }],
  patch: [1, { test: true }],
  remove: [1]
}

module.exports = function assertRequiresAuth (service, method) {
  assert(typeof service[method] === 'function', `the service has a ${method} method`)

  return service[method](...args[method])
    .then(res => {
      assert(!res, 'should not have received a response')
    })
    .catch(error => {
      assert(error.className === 'not-authenticated', 'received the correct error message')
    })
}
