const assert = require('assert')
const args = {
  find: [{}],
  get: [1],
  create: [{ test: true }],
  update: [1, { test: true }],
  patch: [1, { test: true }],
  remove: [1]
}

module.exports = function assertDisallows (service, method) {
  assert(typeof service[method] === 'function', `the service has a ${method} method`)

  return service[method](...args[method])
    .then(res => {
      assert(!res, 'should not have received a response')
    })
    .catch(error => {
      assert(error.className === 'method-not-allowed')
    })
}
