'use strict'

// icoinvestors-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const icoinvestors = new Schema({
    email: { type: String, unique: true, lowercase: true, required: true },
    // Address will be populated by Wallet when new user is created with the same email
    address: { type: String },
    balanceOwed: { type: Number },
    manualPaymentRequired: { type: Boolean, default: false }

  }, {
    timestamps: true
  })

  return mongooseClient.model('icoinvestors', icoinvestors)
}
