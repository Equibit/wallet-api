module.exports = function restrict2ndFactor (options) {
  return function (hook) {
    // Two cases looking for 2FA.  The first is to validate
    //   the authentication code.  Leave it on the object,
    //   and remove everything else
    if (hook.user.twoFactorValidatedSession) {
      return hook
    } else if (hook.data.twoFactorCode) {
      hook.data = {
        twoFactorCode: hook.data.twoFactorCode
      }
      return hook
    } else {
      throw new Error('Must validate session with 2FA')
    }
  }
}
