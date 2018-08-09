const payout = require('../../../utils/send-eqb-payment')
module.exports = function () {
  return hook => {
    const investorsService = hook.app.service('icoinvestors')
    let addressEQB
    const email = (hook.params.user && hook.params.user.email) || hook.data.email
    if (hook.data.type === 'EQB') {
      addressEQB = hook.data.importAddress
    }
    if (email && addressEQB) {
      const balanceThreshold = hook.app.get('icoPayoutThreshold') * 100000000
      const random = Math.random()
      // use patch rather than find to atomically check and set the locked field
      return investorsService.patch(null, {locked: random}, {query: {
        locked: 0,
        email,
        status: 'OWED'
      }})
        .then((data) => {
          if (data[0]) {
            if (data[0].locked !== random) {
              // another instance of this service has the lock
              return
            }
            // If balance is less than threshold, that means we can automatically dispense and delete. If it is not, then it is manual
            if (data[0].balanceOwed && data[0].balanceOwed < balanceThreshold) {
              // Here we add the payment methods, payable to EQB address of user
              // Then remove the entry
              const app = hook.app
              return payout(app, app.get('icoPayoutAddress'), app.get('icoPayoutKey'), addressEQB, data[0].balanceOwed, 'Automated ICO payment').then(
                () => investorsService.patch(data[0]._id, { address: null, status: 'PAID', locked: 0 }),
                // in the case of a failed payment, flag the record as needing to be manually handled
                err => {
                  console.log('error sending an ico payment:', err.message)
                  return investorsService.patch(
                    data[0]._id,
                    { address: addressEQB,
                      status: 'MANUALREQUIRED',
                      locked: 0,
                      error: err.message
                    })
                })
            } else {
              return investorsService.patch(
                data[0]._id,
                {
                  address: addressEQB,
                  status: 'MANUALREQUIRED',
                  locked: 0
                })
            }
          }
        }).then(() => hook, () => hook)
    } else {
      return hook
    }
  }
}
