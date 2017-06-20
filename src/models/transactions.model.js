// transactions-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const transactions = new mongooseClient.Schema({
    // Used to link a transaction to a portfolio in the UI
    // When we create a transaction, we always record the `address`.
    // MUST BE SENT FROM BROWSER
    // Validate it by making RPCs using
    address: { type: String, required: true },
    // These are required in the request for better efficiency in validating the sender's address
    // but we do not record them
    // addressTxid: { type: String, required: true },
    // addressVout: { type: Number, required: true },

    // We also create a second transaction with this `toAddress` set as the `address`
    // That second transaction record will not need a `toAddress` field.
    // MUST BE SENT FROM BROWSER
    // Validate that this address made it into the vout addresses
    toAddress: { type: String },

    type: { type: String, enum: [ 'OUT', 'IN', 'BUY', 'SELL' ], required: true },
    currencyType: { type: String, enum: [ 'BTC', 'EQB', 'BOTH' ], required: true },
    companyName: { type: String },
    issuanceName: { type: String },
    // status: { type: String, enum: [ 'Trading' ] }, // for Buy & Sell
    txIdBtc: { type: String }, // Buy & Sell?
    txIdEqb: { type: String }, // Buy & Sell?
    // quantity: { type: Number }, // Integer

    // TODO: Validate the amount.
    amount: { type: Number, required: true }, // Integer

    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('transactions', transactions)
}
