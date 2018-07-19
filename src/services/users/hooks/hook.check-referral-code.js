const errors = require('feathers-errors')

module.exports = function () {
  return function (hook) {
    hook.app.service('referral-codes').find({ query: { referralCode: hook.data.referral } })
    .then(() => Promise.resolve(hook))
    .catch(err => Promise.reject(new errors.BadRequest(err.message)))
  }
}
