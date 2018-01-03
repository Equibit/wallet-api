const signed = require('feathers-authentication-signed/client')
const crypto = require('crypto')
const errors = require('feathers-errors')

const defaults = {
  passwordField: 'password',
  saltField: 'salt'
}
module.exports = function (options) {
  options = Object.assign({}, defaults, options)
  return function (hook) {
    var emptyStringHash = signed(crypto).createHash('', hook.data[options.saltField] || hook.user[options.saltField])

    if (hook.data[options.passwordField] === emptyStringHash) {
      throw new errors.BadRequest({
        message: 'Password cannot be empty',
        errors: {
          [options.passwordField]: 'Password is missing'
        }
      })
    }
    return hook
  }
}
