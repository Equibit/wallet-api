const payout = require('../../../utils/send-eqb-payment')

module.exports = function () {
  return function (hook) {
    if (typeof hook.params.address === 'undefined') {
      return hook
    }

    const id = hook.result._id
    debugger;
    return hook.app.service('questionnaires').get(hook.result.questionnaireId)
      .then(questionnaire => {
        const reward = questionnaire.reward
        if (reward < 0 || reward  > 50000000) {
          throw new Error(`Reward amount must be greater than 0 EQB and less than eqaul to 0.5 EQB.`)
        }

        const address = hook.params.address
        const rewardAddress = hook.app.get('rewardAddress')
        const rewardKey = hook.app.get('rewardKey')
        return payout(hook.app, rewardAddress, rewardKey, address, reward, 'Automated reward payment')
          .then(
            () => hook.service.patch(id, { status: 'REWARDED', address: null }),
            err =>
              // Payment did not go through
              hook.service.patch(id, { address, status: 'MANUALREQUIRED', error: err.message }))
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
