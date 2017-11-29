function aggregateByAddress (result) {
  return result.reduce((acc, txout) => {
    acc.summary.total += txout.amount
    if (!acc.addresses[txout.address]) {
      acc.addresses[txout.address] = {
        amount: 0,
        txouts: []
      }
    }
    acc.addresses[txout.address].amount += txout.amount
    acc.addresses[txout.address].txouts.push(txout)
    return acc
  }, {summary: {total: 0}, addresses: {}})
}

function addSummary (result) {
  const summary = result.reduce((acc, txout) => {
    acc.summary.total += txout.amount
    return acc
  }, {summary: {total: 0}})
  summary.txouts = result
  return summary
}

function resultToSatoshi (result) {
  const results = result instanceof Array ? result : [result]
  return results.map(item => {
    item.amount = Math.floor(item.amount * 100000000)
    return item
  })
}

module.exports = {
  aggregateByAddress,
  addSummary,
  resultToSatoshi
}
