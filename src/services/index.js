'use strict'

const users = require('./users/users.service')
const companies = require('./companies/companies.service')
const issuances = require('./issuances/issuances.service')
const postmark = require('./postmark-messages')
const forgotPassword = require('./forgot-password/forgot-password.service')
const orders = require('./orders/orders.service.js')

const loginAttempts = require('./login-attempts/login-attempts.service.js')

const balances = require('./balances/balances.service.js')
module.exports = function () {
  const app = this
  app.configure(users)
  app.configure(companies)
  app.configure(issuances)
  app.configure(postmark)
  app.configure(forgotPassword)
  app.configure(orders)
  app.configure(loginAttempts)
  app.configure(balances)
}
