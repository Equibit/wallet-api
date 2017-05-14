'use strict'

const mongoose = require('mongoose')

module.exports = function () {
  const app = this

  console.log(app.get('mongodb'))

  mongoose.connect(app.get('mongodb'))
  mongoose.Promise = global.Promise

  app.set('mongooseClient', mongoose)
}
