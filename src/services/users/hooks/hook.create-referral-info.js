const errors = require('feathers-errors')

module.exports = function () {
  return function (hook) {
    return hook.app.service('referral-codes').find({ query: { referralCode: hook.data.referral } })
    .then(res => hook.app.service('referral-info').create({
      referralCodeId: res.data[0]._id,
      timeCreated: Date.now(),
      email: hook.data.email
    }))
    .then(() => {
      console.log('test')
      return Promise.resolve(hook)
    })
    .catch(err => Promise.reject(new errors.BadRequest(err.message)))
  }
}
