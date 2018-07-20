const readline = require('readline')
const path = require('path')
// const mongoose = require('mongoose')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const mongoose = require('./mongoose')

if (process.argv.length < 3) {
  console.log('Usage: ', __filename, ' <JSON file>')
  process.exit(-1)
}

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
          resolve([description, 'closed'])
        } else {
          console.log('(y|n)')
          waitForUserInput()
        }
      })
    }
    waitForUserInput()
  })
}

function askReward ([description, status]) {
  return new Promise(function (resolve) {
    function waitForUserInput () {
      r1.question('What is the reward? ', (reward) => {
        if (!isNaN(Number(reward)) && typeof Number(reward) === 'number') {
          resolve([description, status, reward])
        } else {
          console.log('Reward must be a number!')
          waitForUserInput()
        }
      })
    }
    waitForUserInput()
  })
}

const app = feathers()
app.configure(configuration(path.join(__dirname, '..')))
app.configure(mongoose)
const createQuestionnaireModel = require('./services/questionnaires/questionnaires.model')
const createQuestionsModel = require('./services/questions/questions.model')
const cli = app.get('mongooseClient')

const Questionnaires = createQuestionnaireModel(app)
const Questions = createQuestionsModel(app)

askDescription()
  .then(askStatus)
  .then(askReward)
  .then(([description, status, reward]) => {
    r1.close()
    return Questionnaires.create({description: description, status: status, reward: reward})
  })
  .then((questionnaire) => {
    const file = process.argv[process.argv.length - 1]
    const orig = require(path.join(process.cwd(), file))
    const data = orig.map((val) => {
      val.questionnaireId = questionnaire.id
      return val
    })
    return Questions.insertMany(data)
  })
  .then((questions) => {
    console.log(questions.length + ' questions added.')
    cli.connection.close()
  })
  .catch((err) => {
    console.log('Error: ' + err.message)
    cli.connection.close()
  })
