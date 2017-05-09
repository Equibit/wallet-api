module.exports = function () {
  return hook => {
    return new Promise(resolve => {
      if (hook.params.headers && hook.params.headers['user-agent']) {
        hook.params.userAgent = require('ua-parser').parse(hook.params.headers['user-agent'])
      }
      resolve(hook)
    })
  }
}
