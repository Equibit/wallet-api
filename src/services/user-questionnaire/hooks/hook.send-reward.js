// const payout = require('../../../utils/send-eqb-payment')

// module.exports = function () {
//   return function (hook) {
//     if (hook.result.status === 'REWARDED' ||
//       hook.result.status === 'MANUALREQUIRED' ||
//       !hook.data.hasOwnProperty('address')) {
//       return hook
//     }

// //     return hook.service.patch(null, {locked: random}, {query: { locked: 0, _id: hook.id, status: 'COMPLETED' }})

//     const id = hook.result._id
//     return hook.app.service('questionnaires').get(hook.result.questionnaireId)
//     .then(questionnaire => {
//       const reward = questionnaire.reward
//       const balanceThreshold = 100 * 100000000
//       if (reward < balanceThreshold) {
//         const reward = questionnaire.reward
//         const address = hook.data.address
//         const rewardAddress = hook.app.get('rewardAddress')
//         const rewardKey = hook.app.get('rewardKey')
//         return payout(hook.app, rewardAddress, rewardKey, address, reward, 'Automated reward payment')
//           .then(
//             () => hook.service.patch(id, {status: 'REWARDED', manualPaymentRequired: false}),
//             () =>
//               // Payment did not go through
//               hook.service.patch(id, {manualPaymentRequired: true}))
//       }
//       return hook.service.patch(id, {manualPaymentRequired: true})
//     },
//     result => Promise.resolve(result)
//     )
//     .then(result => {
//       hook.result = result
//       return hook
//     })
//     .catch(err => {
//       console.log(err.message)
//       return hook
//     })
//   }
// }
// =======
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
