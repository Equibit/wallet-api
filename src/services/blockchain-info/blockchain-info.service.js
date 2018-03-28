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
function checkBlockchains (app, service) {
  const proxycoreService = app.service('proxycore')
  const blockchainTypes = ['EQB', 'BTC']

  return function () {
    console.log('\n\n*** Scheduled [checkBlockchains] ...')
    return Promise.all(blockchainTypes.map(checkBlockchain(service, proxycoreService)))
    // return Promise.all([getFromDB(service, blockchainTypes), getFromBlockchain(proxycoreService, blockchainTypes)])
    //   .then(compareInfo)
    //   .then(updateDB)
  }
}
function checkBlockchain (service, proxycoreService) {
  return function (coinType) {
    console.log(`- checkBlockchain ${coinType}`)
    return Promise.all([
        getFromDB(service, coinType),
        getFromBlockchain(proxycoreService, coinType)
      ])
      .then(compareInfo(coinType))
      .then(updateDB(service, coinType))
  }
}
function getFromDB (service, coinType) {
  console.log(`- getFromDB ${coinType}`)
  return service.find({ query: { coinType } }).then(result => {
    console.log(`- [getFromDB ${coinType}] result.total = ${result.total}`)
    const blockchainInfo = (result.total && result.data && result.data[0]) || null
    return blockchainInfo ? Promise.resolve(blockchainInfo) : service.create({
      coinType,
      status: false,
      mode: 'unknown'
    })
  })
}
function getFromBlockchain (proxycoreService, coinType) {
  console.log(`- getFromBlockchain ${coinType}`)
  return proxycoreService.find({
    query: {
      node: coinType.toLowerCase(),
      method: 'getblockchaininfo'
    }
  }).then(normalizeBlockchainInfo(coinType))
}
function normalizeBlockchainInfo (coinType) {
  return function (response) {
    console.log(`- normalizeBlockchainInfo ${coinType}`)
    if (response.error) {
      throw new Error(response.error.message)
    }
    const blockchainInfo = response.result
    const newData = {
      mode: blockchainInfo.chain,
      status: true,
      currentBlockHeight: blockchainInfo.blocks,
      bestblockhash: blockchainInfo.bestblockhash,
      difficulty: blockchainInfo.difficulty,
      errorMessage: ''
    }
    return newData
  }
}
function compareInfo (coinType){
  return function ([current, newData]) {
    const id = current._id
    const hasChanged = Object.keys(newData).reduce((acc, key) => (acc || (current[key] !== newData[key] && key)), null)
    if (hasChanged) {
      console.log(`- ${coinType} hasChanged ${hasChanged} (old=${current[hasChanged]}, new=${newData[hasChanged]}): current, new::`, current, newData)
    }
    return hasChanged ? { newData, id } : { id }
  }
}
function updateDB (service, coinType) {
  return function ({ newData, id }) {
    return newData
      ? service.patch(id, newData).then(result => {
        console.log(`- patched ${coinType} result = `, result)
        return result
      }) : Promise.resolve(true)
  }
}

function checkBlockchain0 (app, service) {
  console.log('*** [checkBlockchain] ...')
  const proxycoreService = app.service('proxycore')
  const blockchainTypes = ['EQB', 'BTC']

  let blockchainsCached = {EQB: null, BTC: null}

  // Query DB for existing records and create if they do not exist:
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
    return Promise.all(promises)
  })

  .then(blockchains => {
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
        })

        .then((blockchainInfo) => {

          console.log(`- getblockchaininfo ${blockchain.coinType}: blockchainInfo = `, blockchainInfo)
          if (blockchainInfo.error) {
            throw new Error(blockchainInfo.error.message)
          }
          const result = blockchainInfo.result
          const newData = {
            mode: result.chain,
            status: true,
            currentBlockHeight: result.blocks,
            bestblockhash: result.bestblockhash,
            difficulty: result.difficulty,
            errorMessage: ''
          }
          const current = blockchainsCached[blockchain.coinType]
          const hasChanged = Object.keys(newData).reduce((acc, key) => (acc || (current[key] !== newData[key] && key)), null)
          console.log(`- *** compare: hasChanged = ${hasChanged}`)
          if (!hasChanged) {
            return result
          } else {
            console.log(`- hasChanged (old=${current[hasChanged]}, new=${newData[hasChanged]}): current, new::`, current, newData)
          }
          return service.patch(blockchain._id, newData).then(result => {
            console.log(`- patched ${blockchain.coinType} result = `, result)
            return result
          })
        }).catch(err => {
          console.log(`*** ERROR [checkBlockchain] coinType=${blockchain.coinType}`, err)
          return service.patch(blockchain._id, {
            status: 0,
            errorMessage: err.message
          })
        })
      })
    }
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

  // Run blockchain query and schedule for every ~10 minutes:
  const queryBlockchain = checkBlockchains(app, service)
  queryBlockchain()
  setInterval(
    queryBlockchain,
    7000
  )
}
