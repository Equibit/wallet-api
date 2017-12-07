// const { createHash } = require('crypto')
const errors = require('feathers-errors')
const generateSecret = require('feathers-authentication-signed/lib/utils/generate-secret')

const defaults = {
  dataPasswordField: 'oldPassword',
  userPasswordField: 'password',
  saltField: 'salt',
  tempPasswordField: 'tempPassword'
}

module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  return function (hook) {
    // Don't verify if using temp password.  Let the user set a new password the first time.
    if (!hook.user[options.tempPasswordField]) {
      // The old password is kept at the end of the pastPasswordHashes list
      return generateSecret(options)(hook.data[options.dataPasswordField], hook.user[options.saltField]).then(secret => {
        if (secret !== hook.user[options.userPasswordField]
        // createHash('sha256').update(hook.data.oldPassword).digest('hex') !==
        //  hook.user.pastPasswordHashes[hook.user.pastPasswordHashes.length - 1]
        ) {
          throw new errors.BadRequest(`Old password was incorrect.`)
        } else {
          return hook
        }
      })
    }
  }
}
