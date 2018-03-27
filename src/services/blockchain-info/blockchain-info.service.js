// Initializes the `blockchain-info` service on path `/blockchain-info`
const createService = require('feathers-mongoose')
const createModel = require('./blockchain-info.model')
const hooks = require('./blockchain-info.hooks')
const filters = require('./blockchain-info.filters')

// Bitcoin RPC methods:
// - GetBlockChainInfo: () => (infoObject)
// - GetBlock: (blockHash, format) => (blockString | blockObject)
// - GetBlockHash: (blockHeight) => (blockHash)

// Query connected blockchains for info (every 10 minutes):
function checkBlockchain (app, service) {
  console.log('*** [checkBlockchain] ...')
  const proxycoreService = app.service('proxycore')
  const blockchainTypes = ['EQB', 'BTC']
  let blockchainsCached = {EQB: null, BTC: null}

  // Look for existing records and create if they do not exist:
  return service.find({type: {'$in': blockchainTypes}}).then(result => {
    console.log(`- [checkBlockchain] result.total = ${result.total}`)
    const promises = blockchainTypes.map(coinType => {
      const blockchain = result.data.reduce((res, item) => (res || (item.coinType === coinType && item)), null)
      return blockchain ? Promise.resolve(blockchain) : service.create({
        coinType,
        status: false,
        mode: 'unknown'
      })
    })

    return Promise.all(promises).then(blockchains => {
      console.log('checkBlockchain SETUP resolved: blockchains = ', blockchains)

      return function () {
        console.log(`\n\n*** Scheduler [checkBlockchain] running ...`)
        return blockchains.map(blockchain => {

          // Cache result to detect changes after we query info:
          blockchainsCached[blockchain.coinType] = blockchain

          return proxycoreService.find({
            query: {
              node: blockchain.coinType.toLowerCase(),
              method: 'getblockchaininfo'
            }
          }).then(({result}) => {
            const newData = {
              mode: result.chain,
              status: true,
              currentBlockHeight: result.blocks,
              bestblockhash: result.bestblockhash,
              difficulty: result.difficulty
            }
            const current = blockchainsCached[blockchain.coinType]
            const hasChanged = Object.keys(newData).reduce((acc, key) => (acc || current[key] !== newData[key]), false)
            console.log(`- *** compare: hasChanged = ${hasChanged}`)
            if (!hasChanged) {
              return result
            }
            return service.patch(blockchain._id, newData).then(result => {
              console.log(`- patched ${blockchain.coinType} result = `, result)
              return result
            })
          }).catch(err => {
            console.log(`*** ERROR [checkBlockchain] coinType=${blockchain.coinType}`, err)
            return service.patch(blockchain._id, {
              status: 0
            })
          })
        })
      }
    })
  })

}

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'blockchain-info',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/blockchain-info', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('blockchain-info')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }

  // Setup blockchain query handler and schedule to be run every 10 minutes:
  checkBlockchain(app, service).then(handler => setInterval(handler, 3000))
}
