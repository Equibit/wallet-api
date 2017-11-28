const { createHash } = require('feathers-authentication-signed/utils')

const defaults = {
  dataToHashField: 'emailVerificationCode',
  hashedDataField: 'emailVerificationCode',
  timeoutMinutes: 30
}

module.exports = function (options) {
  options = Object.assign({}, defaults, options)
  return function (hook) {
    if (createHash(hook.data[options.dataToHashField]) !== hook.user[options.hashedDataField]) {
      throw new Error('code verification failed')
    }
    if (hook.user.updatedAt.getTime() < Date.now() - options.timeoutMinutes * 60000) {
      throw new Error('code verification timeout has expired')
    }
    return hook
  }
}
