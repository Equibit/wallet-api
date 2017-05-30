const args = {
  find: [{}],
  get: [1],
  create: [{ test: true }],
  update: [1, { test: true }],
  patch: [1, { test: true }],
  remove: [1]
}

module.exports = function (service, method, assert, done) {
  assert(typeof service[method] === 'function', `the service has a ${method} method`)

  service[method].apply(service, args[method])
    .then(res => {
      assert(!res, 'should not have received a response')
    })
    .catch(error => {
      assert(error.className === 'not-authenticated')
      done()
    })
}
