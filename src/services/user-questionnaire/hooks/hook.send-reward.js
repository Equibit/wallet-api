
const payout = require('../../../utils/send-eqb-payment')

module.exports = function () {
  return function (hook) {
    if (hook.data.status !== 'COMPLETED' || !hook.data.hasOwnProperty('address')) {
      return hook
    }

    const random = Math.random()
    return hook.service.patch(null, {locked: random}, {query: { locked: 0, _id: hook.id, status: 'COMPLETED' }})
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].locked === random) {
          return hook.app.service('questionnaires').get(hook.result.questionnaireId)
        }
        return Promise.reject(hook.result)
      })
      .then(questionnaire => {
        const reward = questionnaire.reward
        const address = hook.data.address
        const rewardAddress = hook.app.get('rewardAddress')
        const rewardKey = hook.app.get('rewardKey')
        return payout(hook.app, rewardAddress, rewardKey, address, reward, 'Automated reward payment')
          .then(
            () => hook.service.patch(hook.id, {status: 'REWARDED', locked: 0}),
            err =>
              // Payment did not go through
              hook.service.patch(hook.id, {address, locked: 0, status: 'MANUALREQUIRED', error: err.message}))
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
