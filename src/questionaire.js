const path = require('path')
// const mongoose = require('mongoose')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const mongoose = require('./mongoose')

if (process.argv.length < 3) {
  console.log('Usage: ', __filename, ' <JSON file>')
  process.exit(-1)
}

const app = feathers()
app.configure(configuration(path.join(__dirname, '..')))
app.configure(mongoose)
const createModel = require('./services/questionaire/questionaire.model')
const cli = app.get('mongooseClient')

const Questionaire = createModel(app)

const file = process.argv[process.argv.length - 1]
Questionaire.insertMany(require(path.join(process.cwd(), file)), (err, doc) => {
  if (err) {
    console.log('Error: ' + err.message)
  }
  console.log(doc.length + ' questions added')
  cli.connection.close()
})
