const errors = require('feathers-errors')

module.exports = function () {
  return function (hook) {
    return hook.app.service('referral-codes').find({ query: { referralCode: hook.data.referral } })
      .then(res => {
        if (!res.data || res.data.length === 0) {
          return Promise.reject(new errors.BadRequest('Referral code does not exist!'))
        }
        return hook.app.service('referral-info').create({
          referralCodeId: res.data[0]._id,
          email: hook.data.email})
      })
      .then(() => Promise.resolve(hook))
  }
}
