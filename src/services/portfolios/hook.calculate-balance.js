const errors = require('feathers-errors')

module.exports = function () {
  return function calculatePortfolioBalanceHook (context) {
    let portfolios
    if (context.method === 'find') {
      portfolios = context.result.data || context.result
    } else {
      portfolios = Array.isArray(context.result) ? context.result : [context.result]
    }

    portfolios.forEach(portfolio => {
      // Flag the balance as updating
      portfolio.isBalanceCalculating = true

      updatePortfolioBalance(context.service, portfolio, context.params)
    })

    // Resolve immediately. The balance will be sent in an `updated` event.
    return Promise.resolve(context)
  }
}

function updatePortfolioBalance (service, portfolio, params) {
  const id = portfolio.id || portfolio._id

  if (!id) {
    throw new errors.GeneralError('The portfolio did not have an `id` property.')
  }

  // TODO: make requests to calculate the balance.
  setTimeout(function () {
    const updateData = {
      balance: 100,
      isBalanceCalculating: false
    }
    service.update(id, updateData)
  }, 200)
}

module.exports.updatePortfolioBalance = updatePortfolioBalance
