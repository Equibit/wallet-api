const mongoose = require('mongoose')

module.exports = function () {
  const app = this
  const mongodbUri = app.get('mongodb')

  mongoose.connect(mongodbUri, function (error) {
    console.log(`*** ERROR! Cannot connect to database! Mongo DB URI: "${mongodbUri || 'UNDEFINED!'}"`)
    console.log('Error: ', error)
  })

  mongoose.Promise = global.Promise

  app.set('mongooseClient', mongoose)
}
