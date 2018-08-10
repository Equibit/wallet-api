const payout = require('../../../utils/send-eqb-payment')

module.exports = function () {
  return function (hook) {
    if (typeof hook.params.address === 'undefined') {
      return hook
    }

    const id = hook.result._id
    return hook.app.service('questionnaires').get(hook.result.questionnaireId)
      .then(questionnaire => {
        const reward = questionnaire.reward
        const address = hook.params.address
        const rewardAddress = hook.app.get('rewardAddress')
        const rewardKey = hook.app.get('rewardKey')
        return payout(hook.app, rewardAddress, rewardKey, address, reward, 'Automated reward payment')
          .then(
            () => hook.service.patch(id, {status: 'REWARDED', address: null}),
            err =>
              // Payment did not go through
              hook.service.patch(id, {address, status: 'MANUALREQUIRED', error: err.message}))
      })
      .then(result => {
        hook.result = result
        return hook
      })
      .catch(err => {
        console.log(err.message)
        return hook
      })
  }
}
