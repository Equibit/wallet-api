const readline = require('readline')
const path = require('path')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const mongoose = require('./mongoose')

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askDescription () {
  return new Promise((resolve) => {
    r1.question('What is the description? ', (description) => { resolve(description) })
  })
}

function askStatus (description) {
  return new Promise(function (resolve) {
    function waitForUserInput () {
      r1.question('Is the status active (y|n)? ', (status) => {
        status = status.toLowerCase()
        if (status === 'y') {
          resolve([description, 'active'])
        } else if (status === 'n') {
          resolve([description, 'disabled'])
        } else {
          console.log('(y|n)')
          waitForUserInput()
        }
      })
    }
    waitForUserInput()
  })
}

function askCode ([description, status]) {
  return new Promise(function (resolve) {
    function waitForUserInput () {
      r1.question('Enter the referral code: ', (referralCode) => {
        resolve([description, status, referralCode])
      }
      )
    }
    waitForUserInput()
  })
}

const app = feathers()
app.configure(configuration(path.join(__dirname, '..')))
app.configure(mongoose)
const createReferralCodes = require('./services/referral-codes/referral-codes.model')
const cli = app.get('mongooseClient')

const referralCodes = createReferralCodes(app)

askDescription()
  .then(askStatus)
  .then(askCode)
  .then(([description, status, referralCode]) => {
    r1.close()
    return referralCodes.create({description: description, status: status, referralCode: referralCode})
  })
  .then(() => {
    console.log('Referral code added.')
    cli.connection.close()
  })
  .catch((err) => {
    console.log('Error: ' + err.message)
    cli.connection.close()
  })
