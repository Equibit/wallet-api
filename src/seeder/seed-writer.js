const ffs = require('feathers-fs')
const seedIssuances = require('./seed.issuances')
const seedBuyOrders = require('./seed.buy-orders')

module.exports = function (app) {
  app.service('seeder', ffs({
    root: app.get('applicationRoot')
  }))
  seedIssuances(app)
    .then(({issuances, companies}) => {
      return seedBuyOrders(app, issuances)
    }).then(buyOrders => {
      console.log('created companies.seed.json')
      console.log('created issuances.seed.json')
    })
}
