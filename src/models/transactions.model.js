// transactions-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const transactions = new mongooseClient.Schema({
    address: { type: String, required: true }, // A re-hashed address hash.
    type: { type: String, enum: [ 'BTC', 'EQB' ] },
    companyName: { type: String },
    issuanceName: { type: String },
    txnId: { type: String }, // encrypted?
    amount: { type: Number }, // Integer?
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('transactions', transactions)
}
