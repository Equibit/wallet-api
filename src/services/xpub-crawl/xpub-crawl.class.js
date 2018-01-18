const bitcoin = require('bitcoinjs-lib')

const createPortfolioAddresses = function createPortfolioAddresses (portfolioId, type, isChange, addessIndexStart, howMany) {
  const portfolioAddresses = []
  for (var x = addessIndexStart; x < addessIndexStart + howMany; x++) {
    portfolioAddresses.push({
      portfolioId,
      index: x,
      type,
      isChange,
      isUsed: false // will be checked and updated later
    })
  }
  return portfolioAddresses
}

// hdnode = xpub of ( m / purpose' / coin_type' / account' )
// for each portfolioAddress, derive address = hdnode -> ( / change / addressIndex )
// returns addressesMap[ base58address ] = portfolioAddress
const deriveAddresses = function deriveAddresses (hdnode, portfolioAddresses) {
  const addressesMap = {}

  portfolioAddresses.forEach(portfolioAddress => {
    const change = portfolioAddress.isChange ? 1 : 0
    const addressIndex = portfolioAddress.index
    const address = hdnode.derive(change).derive(addressIndex).getAddress()
    addressesMap[address] = portfolioAddress
  })

  return addressesMap
}

const upsertPortfolioAddressesIfNeeded = function upsertPortfolioAddressesIfNeeded (portfolioAddressesService, meta, unspentData) {
  var promise = null

  // if it is an existing portfolio-addresses item, and wasn't previously used, and is now used, flag it as used
  if (meta._id && meta.isUsed === false && unspentData.amount) {
    promise = portfolioAddressesService.patch(meta._id, { isUsed: true })
  }

  // if it is not an existing portfolio-addresses item, add it
  if (!meta._id) {
    const createData = {
      portfolioId: meta.portfolioId,
      index: meta.index,
      type: meta.type.toUpperCase(), // EQB or BTC
      isChange: meta.isChange ? true : false,
      isUsed: unspentData.amount ? true : false
    }
    promise = portfolioAddressesService.create(createData).then(response => {
      // add the new id to the meta info
      meta._id = response._id
      return response
    })
  }

  return promise
}

const checkUnspentAndMarkUsedAddresses = function checkUnspentAndMarkUsedAddresses (listUnspentService, portfolioAddressesService, type, addressesMap) {
  var typeLC = type.toLowerCase()
  var addresses = Object.keys(addressesMap)
  var query = {
    [typeLC]: addresses,
    byaddress: true
  }
  return listUnspentService.find({ query })
    .then(unspent => {
      unspent = unspent[ type.toUpperCase() ].addresses
      // unspent = object whos keys are addresses and values are: { amount, txouts[] }

      const promises = []
      // loop over addressMap's addresses and update/insert to portfolio-addresses as needed
      addresses.forEach(address => {
        const meta = addressesMap[address]
        const unspentData = unspent[address] || {}

        const prom = upsertPortfolioAddressesIfNeeded(portfolioAddressesService, meta, unspentData)
        if (prom) {
          promises.push(prom)
        }

        const isUsedNow = unspentData.amount ? true : false

        // update meta info
        // add an 'amount' field to addresses meta info
        meta.amount = (meta.amount || 0) + (unspentData.amount || 0)
        // and add the base58 address to it
        meta.address = address
        // mark this one as used if it was or is now used (cannot become unused)
        meta.isUsed = meta.isUsed || isUsedNow
      })

      return Promise.all(promises)
    })
}

const checkAllExisting = function checkAllExisting (listUnspentService, portfolioAddressesService, type, hdnode, addresses, index) {
  if (index < addresses.length) {
    const useAddresses = addresses.slice(index, index + 20)
    const addressesMap = deriveAddresses(hdnode, useAddresses)
    const allUpToDatePromise = checkUnspentAndMarkUsedAddresses(listUnspentService, portfolioAddressesService, type, addressesMap)
    return allUpToDatePromise.then(() => {
      return checkAllExisting(listUnspentService, portfolioAddressesService, type, hdnode, addresses, index + 20)
    })
  }
  return Promise.resolve(true)
}

// how many contiguous items at the end of the addresses array are unused
const countGap = function countGap (addresses) {
  var gap = 0
  for (let i = addresses.length - 1; i >= 0; i--) {
    if (addresses[i].isUsed) {
      break
    }
    gap++
  }
  return gap
}

const gapOf20 = function gapOf20 (listUnspentService, portfolioAddressesService, portfolioId, type, isChange, hdnode, addresses) {
  var currentGap = countGap(addresses)

  if (currentGap >= 20) {
    return Promise.resolve(true)
  }

  const generateMoreCount = 20 - currentGap
  const newAddresses = createPortfolioAddresses(portfolioId, type.toUpperCase(), isChange, addresses.length, generateMoreCount)
  Array.prototype.push.apply(addresses, newAddresses)
  const addressesMap = deriveAddresses(hdnode, newAddresses)
  const allUpToDatePromise = checkUnspentAndMarkUsedAddresses(listUnspentService, portfolioAddressesService, type, addressesMap)
  return allUpToDatePromise.then(() => {
    return gapOf20(listUnspentService, portfolioAddressesService, portfolioId, type, isChange, hdnode, addresses)
  })
}

/**
 * This service is very processor intensive.
 * It should be broken off into its own server as soon as needed.
 */
class Service {
  constructor (options) {
    this.options = options || {}
  }

  // params.query.portfolioId
  // params.query.type = 'EQB' or 'BTC'
  // params.query.xpub = ( m / purpose' / coin_type' / account' )
  find (params) {
    const { query } = params
    const { xpub, portfolioId, type } = query
    const { app, network } = this.options
    const portfolioAddressesService = app.service('portfolio-addresses')
    const listUnspentService = app.service('listunspent')
    const hdnode = bitcoin.HDNode.fromBase58(xpub, network)
    const addressesMap = {}
    const typeUPPER = type.toUpperCase()

    return portfolioAddressesService.find({ query: { portfolioId, type: typeUPPER } })
      .then(response => {
        const portfolioAddresses = response.data || []
        const changeAddresses = portfolioAddresses.filter(addr => addr.isChange)
        const externalAddresses = portfolioAddresses.filter(addr => !addr.isChange)

        return Promise.all([
          checkAllExisting(listUnspentService, portfolioAddressesService, typeUPPER, hdnode, changeAddresses, 0),
          checkAllExisting(listUnspentService, portfolioAddressesService, typeUPPER, hdnode, externalAddresses, 0)
        ]).then(() => {
          return Promise.all([
            gapOf20(listUnspentService, portfolioAddressesService, portfolioId, typeUPPER, true, hdnode, changeAddresses),
            gapOf20(listUnspentService, portfolioAddressesService, portfolioId, typeUPPER, false, hdnode, externalAddresses)
          ]).then(() => {
            return Promise.resolve({
              changeAddresses,
              externalAddresses
            })
          })
        })
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
