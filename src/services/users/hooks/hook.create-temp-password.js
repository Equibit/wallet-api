const { createHash } = require('feathers-authentication-signed/utils')
const { randomBytes } = require('crypto')

const defaults = {
  passwordField: 'tempPassword',
  plainPasswordField: 'tempPasswordPlain'
}

// Create temporary password for new signups.
// Though not needed functionally, it returns a promise for consistent testing with other hooks.
module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  return hook => {
    return new Promise(resolve => {
      let tempPassword = randomBytes(8).toString('hex')
      // create a random string which is the user's plain-text tempPassword.
      hook.data[options.plainPasswordField] = tempPassword
      // run tempPassword through the hashPassword hook.
      if (options.passwordField) {
        hook.data[options.passwordField] = createHash(tempPassword)
      }
      if (options.timeStampField) {
        hook.data[options.timeStampField] = Date.now()
      }
      resolve(hook)
    })
  }
}
