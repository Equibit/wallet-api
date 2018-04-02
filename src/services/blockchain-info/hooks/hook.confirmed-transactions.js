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
      const transactionsService = hook.app.service('/transactions')
      let recursivePromise
      // recursive get of next block down.  do this first, before the current block
      // (try to preserve time order)
      if (block.height > hook.params.before.currentBlockHeight + 1) {
        recursivePromise = processNextBlock(hook, block.previousblockhash)
      } else {
        recursivePromise = Promise.resolve(hook)
      }

      return recursivePromise.then(() => {
        return transactionsService.find({
          query: { txId: { $in: block.tx } }
        })
      })
      .then(result => {
        return Promise.all(
          result.data.map(tx => transactionsService.patch(
            tx._id,
            {
              confirmationBlockHeight: block.height
            }
          ).catch(console.error.bind(console))
        )).then(() => hook, () => hook)
      })
    })
  }
  return hook => {
    const blockHeight = hook.result.currentBlockHeight
    if (blockHeight > hook.params.before.currentBlockHeight) {
      processNextBlock(hook, hook.result.bestblockhash)
    }
  }
}
