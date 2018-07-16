const { randomBytes } = require('crypto')

// Create a unique referral code when user is created
module.exports = function (tail) {
  return hook => {
    const app = hook.app
    const referralCodesService = app.service('referral-codes')

    // Find existing user
    hook.service.find({ query: { email: hook.data.email } })
      .then(users => {
        users = users.data || users
        let user = users[0]
        // User already signed up.
        if (user) {
          hook.params.existingUser = user
        }
        return hook
      })
      .then(results => {
        // Use a random string as a referral code, tail resets to 0 when server is restarted
        let generatedCode = randomBytes(5).toString('hex') + randomBytes(5).toString('hex') + tail
        if (results.params.existingUser) {
          const referralCode = {
            userId: results.params.existingUser._id,
            userEmail: results.params.existingUser.email,
            referralCode: generatedCode
          }
          tail++
          referralCodesService.create(referralCode).then(referralCode => {
            return hook
          }).catch(error => {
            console.log('Error: ' + error)
          })
        }
      })
      .catch(err => {
        console.log('Error: ' + err)
      })
  }
}
