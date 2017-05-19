const crypto = require('crypto')
const errors = require('feathers-errors')

const defaults = {
  passwordAttr: 'password', // The user field that holds the current password
  oldPasswordsAttr: 'pastPasswordHashes', // The user field that will hold hashes of old passwords
  passwordCount: 3
}

module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  return hook => {
    // This shouldn't run if no password was provided.
    if (!hook.data || !hook.data.password) {
      return Promise.reject(new errors.BadRequest('No password was provided in the request'))
    }

    const user = hook.params.user
    const newPasswordHash = crypto.createHash('sha256').update(hook.data.password).digest('hex')
    let pastPasswordHashes = user[options.oldPasswordsAttr]

    // Add the `oldPasswordAttr` to the user object if it's not already there.
    if (!Array.isArray(pastPasswordHashes)) {
      pastPasswordHashes = []
    }

    // If the current password was previously used, reject it. Otherwise, save it.
    if (pastPasswordHashes.includes(newPasswordHash)) {
      throw new errors.BadRequest(`You may not use the same password as one of the last ${options.passwordCount} passwords.`)
    } else {
      pastPasswordHashes.push(newPasswordHash)
    }

    // Only keep up to `passwordCount` previous passwords
    for (var i = 0; i < pastPasswordHashes.length; i++) {
      if (pastPasswordHashes.length > options.passwordCount) {
        pastPasswordHashes.shift()
      }
    }

    // Update the current hook.params.user
    user[options.oldPasswordsAttr] = pastPasswordHashes

    // Add the pastPasswordHashes to the patch/update data
    Object.assign(hook.data, { pastPasswordHashes })

    return Promise.resolve(hook)
  }
}
