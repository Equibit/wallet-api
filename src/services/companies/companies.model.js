'use strict'

// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const companies = new mongooseClient.Schema({
    userId: {type: String, required: true},
    index: {type: Number, default: 0, required: true},

    // Legal name:
    name: {type: String, required: true},
    slug: {type: String, required: true},

    // Registration Number:
    registrationNumber: {type: String, required: true},

    // Jurisdiction (Country):
    domicile: {type: String, required: true},

    // Jurisdiction (State/Province):
    state: {type: String}
  }, {
    versionKey: false
  })

  return mongooseClient.model('companies', companies)
}
