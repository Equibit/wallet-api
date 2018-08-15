// payment-logging-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const paymentLogging = new Schema({
    // Amount in Satoshi units
    amount: { type: Number, required: true },
    // Address of receiver
    address: { type: String, required: true },
    // Id of Blockchain transaction
    txId: { type: String, required: true },
    purpose: { type: String, enum: ['TWITTER', 'ICO', 'QUESTIONNAIRE'], required: true },
    // True is OK and False is Error
    status: { type: Boolean, required: true },
    message: { type: String, required: true }
  }, {
    timestamps: true
  })

  return mongooseClient.model('paymentLogging', paymentLogging)
}
