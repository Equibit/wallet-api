
// Create a unique referral code when user is created
module.exports = function () {
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
        let tail = 18
        if (results.params.existingUser) {
          let email = results.params.existingUser.email
        // Take user's unique email username and append a number at the end as a code
          let uniqueCode = email.substring(0, email.indexOf('@')).toUpperCase() + tail

          const referralCode = {
            userId: results.params.existingUser._id,
            userEmail: email,
            referralCode: uniqueCode
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
