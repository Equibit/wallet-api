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
    // console.log('\n\n*** Scheduled [checkBlockchains] ...')
    return Promise.all(blockchainTypes.map(checkBlockchain(service, proxycoreService)))
  }
}
function checkBlockchain (service, proxycoreService) {
  return function (coinType) {
    // console.log(`- checkBlockchain ${coinType}`)
    return Promise.all([
      getFromDB(service, coinType),
      getFromBlockchain(proxycoreService, coinType)
    ])
      .then(compareInfo(coinType))
      .then(updateDB(service, coinType))
      .catch(handleError(service, coinType))
  }
}
function getFromDB (service, coinType) {
  // console.log(`- getFromDB ${coinType}`)
  return service.find({ query: { coinType } }).then(result => {
    // console.log(`- [getFromDB ${coinType}] result.total = ${result.total}`)
    const blockchainInfo = (result.total && result.data && result.data[0]) || null
    return blockchainInfo ? Promise.resolve(blockchainInfo) : service.create({
      coinType,
      status: false,
      feeRates: { priority: 20, regular: 5 },
      mode: 'unknown'
    })
  })
}
function getFromBlockchain (proxycoreService, coinType) {
  // console.log(`- getFromBlockchain ${coinType}`)
  const promises = [
    proxycoreService.find({
      query: {
        node: coinType.toLowerCase(),
        method: 'getblockchaininfo'
      }
    }),
    proxycoreService.find({
      query: {
        node: coinType.toLowerCase(),
        method: 'getnetworkinfo'
      }
    })
  ]
  return Promise.all(promises).then((results) => {
    const blockchainInfo = results[0]
    const networkInfo = results[1]
    // combine the two info objects (preferring the data in the first)
    Object.assign(networkInfo.result, blockchainInfo.result)
    return networkInfo
  }, errs => errs.find(errExists => errExists))
  .then(normalizeBlockchainInfo(coinType))
}
function normalizeBlockchainInfo (coinType) {
  return function (response) {
    // console.log(`- normalizeBlockchainInfo ${coinType}`)
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
      mediantime: blockchainInfo.mediantime,
      relayfee: blockchainInfo.relayfee,
      errorMessage: ''
    }
    return newData
  }
}
function compareInfo (coinType) {
  return function ([current, newData]) {
    const id = current._id
    const hasChanged = Object.keys(newData).reduce((acc, key) => (acc || (current[key] !== newData[key] && key)), null)
    if (hasChanged) {
      console.log(`*** Blockchain Info: ${coinType} hasChanged ${hasChanged} (old=${current[hasChanged]}, new=${newData[hasChanged]})`)
    }
    return hasChanged ? { newData, id } : { id }
  }
}
function updateDB (service, coinType) {
  return function ({ newData, id }) {
    return newData
      ? service.patch(id, newData).then(result => {
        // console.log(`- patched ${coinType} result = `, result)
        return result
      }) : Promise.resolve(true)
  }
}
function handleError (service, coinType) {
  return function (err) {
    console.log(`*** ERROR [handleError] coinType=${coinType}, error: ${err.message}`)
    return service.patch(null, {
      status: 0,
      errorMessage: err.message
    }, { query: { coinType } })
  }
}

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')
  const interval = app.get('blockchainInfoInterval')

  const options = {
    name: 'blockchain-info',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/blockchain-info', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('blockchain-info')

  service.hooks(hooks(app))

  if (service.filter) {
    service.filter(filters)
  }

  const queryBlockchain = checkBlockchains(app, service)
  // queryBlockchain()
  if (process.env.NODE_ENV !== 'ci' && process.env.TESTING !== 'true') {
    // Run blockchain query and schedule for every ~10 minutes:
    setInterval(
      queryBlockchain,
      interval
    )
  }
}

module.exports.checkBlockchains = checkBlockchains
module.exports.checkBlockchain = checkBlockchain
module.exports.getFromDB = getFromDB
module.exports.getFromBlockchain = getFromBlockchain
module.exports.normalizeBlockchainInfo = normalizeBlockchainInfo
module.exports.compareInfo = compareInfo
module.exports.updateDB = updateDB
module.exports.handleError = handleError
