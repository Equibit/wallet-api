'use strict'

const users = require('./users/users.service')
const companies = require('./companies/companies.service')
const issuances = require('./issuances/issuances.service')
const postmark = require('./postmark-messages')
const forgotPassword = require('./forgot-password/forgot-password.service')
const buyOrders = require('./buy-orders/buy-orders.service.js')
const sellOrders = require('./sell-orders/sell-orders.service.js')

module.exports = function () {
  const app = this
  app.configure(users)
  app.configure(companies)
  app.configure(issuances)
  app.configure(postmark)
  app.configure(forgotPassword)
  app.configure(buyOrders)
  app.configure(sellOrders)
}
