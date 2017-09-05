const bitcoin = require('bitcoinjs-lib')

/**
 * This service is very processor intensive.
 * It should be broken off into its own server as soon as needed.
 */
class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    const { query } = params
    const { xpub, type } = query
    const { app, network } = this.options
    const listUnspentService = app.service('listunspent')
    const TYPE = type.toUpperCase()

    // Step 1: generate 20 addresses
    const hdnode = bitcoin.HDNode.fromBase58(xpub, network)

    const createArrayFrom = function createArrayFrom (startingIndex, howMany) {
      const array = []
      for (var index = startingIndex; index < startingIndex + howMany; index++) {
        array.push(index)
      }
      return array
    }

    const mergeResults = function mergeResults (accumulatedResult, newResult) {
      // Add up summary totals
      accumulatedResult.summary.total += newResult.summary.total
      // Merge addresses
      Object.assign(accumulatedResult.addresses, newResult.addresses)
    }

    const crawlAddresses = function crawlAddresses (accumulatedResult, startIndex, howMany) {
      const addresses = createArrayFrom(startIndex, howMany).map((v, index) => {
        return { index: v, address: hdnode.derive(v).getAddress() }
      })
      const { addressesByIndex, indexesByAddress } = addresses.reduce((acc, { address, index }) => {
        const meta = { address, index, used: false }
        acc.addressesByIndex[index] = meta
        acc.indexesByAddress[address] = meta
        return acc
      }, { indexesByAddress: {}, addressesByIndex: {} })

      // Step 2: use `listunspent` with the 20 addresses & see which ones have funds, repeat with remaining addresses until we have 20 empty.
      return listUnspentService.find({ query: { [type]: addresses.map(item => item.address), byaddress: true } })
        .then(newResult => {
          // Step 3: format the data, combine into the accumulated results
          newResult = newResult[TYPE]

          mergeResults(accumulatedResult, newResult)
          Object.assign(accumulatedResult.addressesByIndex, addressesByIndex)
          Object.assign(accumulatedResult.indexesByAddress, indexesByAddress)

          Object.keys(accumulatedResult.addresses).forEach(address => {
            accumulatedResult.addresses[address].address = address
            accumulatedResult.addresses[address].index = accumulatedResult.indexesByAddress[address].index
            accumulatedResult.indexesByAddress[address].used = true
          })

          // Step 4: get the last-used index and make sure we have 20 unused addresses.
          const highest = Object.keys(accumulatedResult.addressesByIndex).reduce((highest, index) => {
            index = parseInt(index)
            highest.used = (accumulatedResult.addressesByIndex[index].used && index > highest.used) ? index : highest.used
            highest.available = index > highest.available ? index : highest.available
            return highest
          }, {used: -1, available: -1})
          const unusedCount = highest.available - highest.used
          if (unusedCount < 20) {
            return crawlAddresses(accumulatedResult, highest.available + 1, 20 - unusedCount)
          } else {
            return accumulatedResult
          }
        })
    }

    const initialResult = {
      type: TYPE,
      summary: {
        total: 0
      },
      addressesByIndex: {},
      indexesByAddress: {},
      addresses: {}
    }
    return crawlAddresses(initialResult, 0, 20)
      .then(result => {
        delete result.indexesByAddress
        return result
      })
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    })
  }

  create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current)))
    }

    return Promise.resolve(data)
  }

  update (id, data, params) {
    return Promise.resolve(data)
  }

  patch (id, data, params) {
    return Promise.resolve(data)
  }

  remove (id, params) {
    return Promise.resolve({ id })
  }
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
