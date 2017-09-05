// Initializes the `xpub-crawl` service on path `/xpub-crawl`
const createService = require('./xpub-crawl.class.js')
const hooks = require('./xpub-crawl.hooks')
const filters = require('./xpub-crawl.filters')
const bitcoin = require('bitcoinjs-lib')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'xpub-crawl',
    paginate,
    app,
    network: bitcoin.networks.testnet
  }

  // Initialize our service with any options it requires
  app.use('/xpub-crawl', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('xpub-crawl')

  service.hooks(hooks)

  if (service.filter) {
    service.filter(filters)
  }
}
