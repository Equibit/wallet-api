'use strict'

const users = require('./users/users.service')
const companies = require('./companies/companies.service')
const issuances = require('./issuances/issuances.service')
const postmark = require('./postmark-messages')
const forgotPassword = require('./forgot-password/forgot-password.service')
const orders = require('./orders/orders.service.js')
const loginAttempts = require('./login-attempts/login-attempts.service.js')
const portfolios = require('./portfolios/portfolios.service.js')
const portfolioAddresses = require('./portfolio-addresses/portfolio-addresses.service.js')
const proxycore = require('./proxycore/proxycore.service.js')
const importAddress = require('./import-address/import-address.service.js')
const importmulti = require('./importmulti/importmulti.service.js')
const watchlist = require('./watchlist/watchlist.service.js')
const listunspent = require('./listunspent/listunspent.service.js')
const transactions = require('./transactions/transactions.service.js')
const subscribe = require('./subscribe/subscribe.service.js')
const portfolioBalance = require('./portfolio-balance/portfolio-balance.service.js')
const xpubCrawl = require('./xpub-crawl/xpub-crawl.service.js')
const offers = require('./offers/offers.service.js')
const bitcoinAverage = require('./bitcoin-average/bitcoin-average.service.js')
const notifications = require('./notifications/notifications.service.js')
const blockchainInfo = require('./blockchain-info/blockchain-info.service.js')
const sellOrdersQuantityOpen = require('./sell-orders-quantity-open/sell-orders-quantity-open.service.js')

const transactionNotes = require('./transaction-notes/transaction-notes.service.js')

const healthCheck = require('./health-check/health-check.service.js')

const bitMessage = require('./bit-message/bit-message.service.js')

const questions = require('./questions/questions.service.js')

const questionaires = require('./questionaires/questionaires.service.js')
const icoinvestors = require('./icoinvestors/icoinvestors.service.js')

const userAnswers = require('./user-answers/user-answers.service.js')
const userQuestionaire = require('./user-questionaire/user-questionaire.service.js')

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
  app.configure(portfolioAddresses)
  app.configure(proxycore)
  app.configure(importAddress)
  app.configure(importmulti)
  app.configure(icoinvestors)
  app.configure(watchlist)
  app.configure(listunspent)
  app.configure(transactions)
  app.configure(subscribe)
  app.configure(portfolioBalance)
  app.configure(xpubCrawl)
  app.configure(offers)
  app.configure(bitcoinAverage)
  app.configure(notifications)
  app.configure(blockchainInfo)
  app.configure(sellOrdersQuantityOpen)
  app.configure(transactionNotes)
  app.configure(healthCheck)
  app.configure(bitMessage)
  app.configure(questions)
  app.configure(questionaires)
  app.configure(userAnswers)
  app.configure(userQuestionaire)
}
