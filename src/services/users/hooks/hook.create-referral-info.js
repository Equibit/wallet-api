module.exports = function () {
  return function (hook) {
    hook.app.service('referral-info').create({
      referralCode: hook.data.referral,
      timeCreated: Date.now(),
      email: hook.data.email
    })
    .then(() => Promise.resolve(hook))
  }
}
