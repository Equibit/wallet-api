'use strict'

module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const paymentInfo = new mongooseClient.Schema({
    address: { type: String },
    key: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    versionKey: false
  })

  return mongooseClient.model('payment-info', paymentInfo)
}
