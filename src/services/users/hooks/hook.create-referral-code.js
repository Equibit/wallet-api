const { randomBytes } = require('crypto')

const defaults = {
  referralCode: 'tempCode'
}

// Create a unique referral code when user is created
module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  return hook => {
    const app = hook.app
    const referralCodesService = app.service('referral-codes')
      // Use a random string as a referral code
    let generatedCode = randomBytes(10).toString('hex')

      // Check if generated string is already in collection
    referralCodesService.find({ query: { referralCode: generatedCode } })
      .then(res => {
        // console.log(res.data)
        if (res.data.referralCode === generatedCode) {
          generatedCode = randomBytes(10).toString('hex')
        }
      })
      .catch(err => {
        console.log('Error: ' + err)
      })

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
        if (results.params.existingUser) {
          const referralCode = {
            userId: results.params.existingUser._id,
            userEmail: results.params.existingUser.email,
            referralCode: generatedCode
          }
          referralCodesService.create(referralCode).then(referralCode => {
            return hook
          }).catch(error => {
            console.log('Error: ' + error)
          })
        }
      })
  }
}
