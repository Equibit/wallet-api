'use strict'

// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const companies = new mongooseClient.Schema({
    name: {type: String},
    slug: {type: String},
    //issuances: []

    userId: {type: String},
    index: {type: Number, default: 1},

    domicile: {type: String},
    streetAddress: {type: String},
    streetAddress2: {type: String},
    city: {type: String},
    state: {type: String},
    postalCode: {type: String},

    contactEmail: {type: String},
    website: {type: String},
    phoneNumber: {type: String},
  }, {
    versionKey: false
  })

  return mongooseClient.model('companies', companies)
}
