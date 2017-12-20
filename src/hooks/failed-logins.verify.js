const defaults = {
  failureCount: 3,
  timeBetweenEmails: 24 * 60 * 60 * 1000 // 1 day
}

/**
 * verifyFailedLogins {HookFunction}
 * Should only be used as an error hook on authentication. It doesn't handle any conditions,
 * so it is assumed that every time it is run it is due to a failed login.
 */
module.exports = function verifyFailedLogins (options) {
  options = Object.assign({}, defaults, options)

  return hook => {
    const timeframe = Date.now() - options.timeBetweenEmails
    const user = hook.params.failedLoginUser
    const currentFailedLogin = {
      date: Date.now(),
      sendEmail: false
    }
    let failedLogins = user.failedLogins || []

    // If there's a failed login with {email:true}, check its date.
    const lastEmailed = failedLogins.filter(login => login.sendEmail === true)[0]

    // If it's before the timestamp, clear the list of failedLogins and start over with this one.
    if (lastEmailed && lastEmailed.date < timeframe) {
      failedLogins = []
    }

    // Don't accumulate more failedLogins until the timeframe resets
    if (failedLogins.length <= options.failureCount - 1) {
      if (failedLogins.length === options.failureCount - 1) {
        currentFailedLogin.sendEmail = true
        hook.params.notifyFailedLogins = true
      }
      failedLogins.push(currentFailedLogin)

      user.failedLogins = failedLogins

      return hook.app.service('users').patch(user._id, { failedLogins })
        .then(user => {
          return hook
        })
    } else {
      delete hook.params.notifyFailedLogins
      return Promise.resolve(hook)
    }
  }
}
