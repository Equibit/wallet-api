module.exports = function () {
  function processNextBlock (hook, hash) {
    return hook.app.service('/proxycore').find({
      query: {
        node: hook.result.coinType.toLowerCase(),
        method: 'getblock',
        params: [hash]
      }
    }).then(result => {
      const block = result.result
      hook.app.service('/transactions').patch(
        null,
        {
          confirmationBlockHeight: block.height
        },
        {
          query: { txId: { $in: block.tx } }
        }).catch(console.error.bind(console))

      // recursive get of next block down
      if (block.height > hook.params.before.currentBlockHeight + 1) {
        return processNextBlock(hook, block.previousblockhash)
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
