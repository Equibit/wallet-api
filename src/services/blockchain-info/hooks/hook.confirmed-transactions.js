module.exports = function () {
  function processNextBlock (hook, hash) {
    return hook.app.service('/proxycore').get({
      node: hook.result.coinType.toLowerCase(),
      action: 'getblock',
      params: [hash]
    }).then(block => {
      block.tx.forEach(txId => {
        hook.app.service('/transactions').patch(
          null,
          {
            confirmationBlockHeight: block.height
          },
          {
            txId
          })
      })

      // recursive get of next block down
      if (block.height > hook.params.before.currentBlockHeight + 1) {
        return processNextBlock(hook, block.previousBlockHash)
      } else {
        return hook
      }
    })
  }
  return hook => {
    const blockHeight = hook.result.currentBlockHeight
    if (blockHeight > hook.params.before.currentBlockHeight) {
      processNextBlock(hook, hook.result.bestblockhash)
    }
  }
}
