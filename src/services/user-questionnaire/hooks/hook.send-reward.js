const payout = require('../../../utils/send-eqb-payment')

module.exports = function () {
  return function (hook) {
    if (hook.result.status !== 'COMPLETED' ||
      hook.result.rewarded ||
      hook.result.manualPaymentRequired ||
      !hook.data.hasOwnProperty('address')) {
      return hook
    }

    const random = Math.random()
    return hook.service.patch(null, {locked: random}, {query: { locked: 0, _id: hook.id }})
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].locked === random) {
          return hook.app.service('questionnaires').get(hook.result.questionnaireId)
        }
        return Promise.reject(hook.result)
      })
      .then(questionnaire => {
        const reward = questionnaire.reward
        const srcAddress = hook.app.get('rewardAddress')
        const srcKey = hook.app.get('rewardKey')
        const address = hook.data.address
        return payout(hook.app, srcAddress, srcKey, address, reward, 'Automated reward payment')
          .then(
            () => hook.service.patch(hook.id, {rewarded: true, locked: 0, manualPaymentRequired: false}),
            () =>
              // Payment did not go through
              hook.service.patch(hook.id, {locked: 0, manualPaymentRequired: true}))
      },
      result => Promise.resolve(result)
      )
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
