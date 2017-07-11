'use strict'

const users = require('./users/users.service')
const companies = require('./companies/companies.service')
const issuances = require('./issuances/issuances.service')
const postmark = require('./postmark-messages')
const forgotPassword = require('./forgot-password/forgot-password.service')
const orders = require('./orders/orders.service.js')
const loginAttempts = require('./login-attempts/login-attempts.service.js')
const portfolios = require('./portfolios/portfolios.service.js')
const proxycore = require('./proxycore/proxycore.service.js')
const watchlist = require('./watchlist/watchlist.service.js')
const listunspent = require('./listunspent/listunspent.service.js')
const transactions = require('./transactions/transactions.service.js')
const subscribe = require('./subscribe/subscribe.service.js')
const addressMap = require('./address-map/address-map.service.js')

const addressMeta = require('./address-meta/address-meta.service.js')

module.exports = function () {
  const app = this
  app.configure(users)
  app.configure(companies)
  app.configure(issuances)
  app.configure(postmark)
  app.configure(forgotPassword)
  app.configure(orders)
  app.configure(loginAttempts)
  app.configure(portfolios)
  app.configure(proxycore)
  app.configure(watchlist)
  app.configure(listunspent)
  app.configure(transactions)
  app.configure(subscribe)
  app.configure(addressMap)
  app.configure(addressMeta)
}
