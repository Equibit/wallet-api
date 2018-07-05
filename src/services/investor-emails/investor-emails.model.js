'use strict'

// investor-emails-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const investorEmails = new Schema({
    email: {type: String, unique: true, lowercase: true},
    hasPortfolio: { type: Boolean, default: false },
    amountOwed: { type: Number, default: 0 },
    flag: { type: Boolean, default: false }

  }, {
      timestamps: true
  })

  return mongooseClient.model('investorEmails', investorEmails)
}
