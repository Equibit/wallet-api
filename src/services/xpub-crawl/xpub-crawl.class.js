const bitcoin = require('bitcoinjs-lib')
const errors = require('feathers-errors')

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

const upsertPortfolioAddressesIfNeeded = function upsertPortfolioAddressesIfNeeded (app, meta, unspentData) {
  const portfolioAddressesService = app.service('portfolio-addresses')
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
      isChange: !!meta.isChange,
      isUsed: !!unspentData.amount
    }
    promise = portfolioAddressesService.create(createData).then(response => {
      // add the new id to the meta info
      meta._id = response._id
      return response
    })
  }

  return promise
}

const checkUnspentAndMarkUsedAddresses = function checkUnspentAndMarkUsedAddresses (app, type, addressesMap) {
  const listUnspentService = app.service('listunspent')
  const typeLC = type.toLowerCase()
  const addresses = Object.keys(addressesMap)
  const query = {
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

        const prom = upsertPortfolioAddressesIfNeeded(app, meta, unspentData)
        if (prom) {
          promises.push(prom)
        }

        const isUsedNow = !!unspentData.amount

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

const checkAllExisting = function checkAllExisting (app, type, hdnode, addresses, index) {
  if (index < addresses.length) {
    const useAddresses = addresses.slice(index, index + 20)
    const addressesMap = deriveAddresses(hdnode, useAddresses)
    const allUpToDatePromise = checkUnspentAndMarkUsedAddresses(app, type, addressesMap)
    return allUpToDatePromise.then(() => {
      return checkAllExisting(app, type, hdnode, addresses, index + 20)
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

// http://localhost:3030/proxycore?node=eqb&method=importmulti&params[0][0][scriptPubKey][address]=mvuf7FVBox77vNEYxxNUvvKsrm2Mq5BtZZ&params[0][0][watchonly]=true&params[0][0][timestamp]=now
/*
  [
    [
      {
        "scriptPubKey": {
          "address": "mvuf7FVBox77vNEYxxNUvvKsrm2Mq5BtZZ"
        },
        "watchonly": true,
        "timestamp": "now"
      }
    ]
  ]
*/
const importAddressesCore = function importAddressesCore (app, type, addressesMap, importFrom) {
  const proxycoreService = app.service('proxycore')
  const timestamp = new Date(importFrom).getTime() || 'now'
  const param = Object.keys(addressesMap).map(address => {
    return { scriptPubKey: { address }, timestamp, watchonly: true }
  })

  const importPromise = proxycoreService.find({
    query: {
      node: type.toLowerCase(),
      method: 'importmulti',
      params: [param]
    }
  })

  return importPromise
}

const gapOf20 = function gapOf20 (app, portfolioId, type, isChange, hdnode, addresses, importFrom) {
  var currentGap = countGap(addresses)

  if (currentGap >= 20) {
    return Promise.resolve(true)
  }

  const generateMoreCount = 20 - currentGap
  const newAddresses = createPortfolioAddresses(portfolioId, type.toUpperCase(), isChange, addresses.length, generateMoreCount)
  Array.prototype.push.apply(addresses, newAddresses)
  const addressesMap = deriveAddresses(hdnode, newAddresses)

  const importPromise = importAddressesCore(app, type, addressesMap, importFrom)

  const allUpToDatePromise = importPromise.then(() => {
    return checkUnspentAndMarkUsedAddresses(app, type, addressesMap)
  })

  return allUpToDatePromise.then(() => {
    return gapOf20(app, portfolioId, type, isChange, hdnode, addresses, importFrom)
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
    const { query, userPortfolios } = params
    const { xpub, portfolioId, type } = query
    const { app, network } = this.options
    const portfolioAddressesService = app.service('portfolio-addresses')
    const hdnode = bitcoin.HDNode.fromBase58(xpub, network)
    const typeUPPER = type.toUpperCase()

    const portfolio = (userPortfolios || []).find(portfolio => portfolio._id.toString() === portfolioId.toString())
    if (!portfolio) {
      return Promise.reject(new errors.BadRequest('portfolio not found'))
    }

    // Date to set as the timestamp when importing new addresses
    // (import crawls blockchain back to the date, enabling listunspent calls to the imported address)
    const importFrom = portfolio.importFrom || portfolio.createData

    return portfolioAddressesService.find({ query: { portfolioId, type: typeUPPER } })
      .then(response => {
        const portfolioAddresses = response.data || []
        const changeAddresses = portfolioAddresses.filter(addr => addr.isChange)
        const externalAddresses = portfolioAddresses.filter(addr => !addr.isChange)

        return Promise.all([
          checkAllExisting(app, typeUPPER, hdnode, changeAddresses, 0),
          checkAllExisting(app, typeUPPER, hdnode, externalAddresses, 0)
        ]).then(() => {
          return Promise.all([
            gapOf20(app, portfolioId, typeUPPER, true, hdnode, changeAddresses, importFrom),
            gapOf20(app, portfolioId, typeUPPER, false, hdnode, externalAddresses, importFrom)
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
