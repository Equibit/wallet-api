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

    // We also create a second transaction with this `otherAddress` set as the `address`
    // That second transaction record will not need a `otherAddress` field.
    // MUST BE SENT FROM BROWSER
    // Validate that this address made it into the vout addresses
    otherAddress: { type: String },

    type: { type: String, enum: [ 'OUT', 'IN', 'BUY', 'SELL', 'TRANSFER', 'AUTH', 'CANCEL' ], required: true },
    currencyType: { type: String, enum: [ 'BTC', 'EQB', 'BOTH' ], required: true },

    companyName: { type: String },
    companySlug: { type: String },
    issuanceId: { type: String },
    issuanceName: { type: String },

    // The values are defined by the Core:
    issuanceType: { type: String, enum: ['common_shares', 'bonds', 'preferred_shares', 'fund_units', 'trust_units', 'bitcoin', 'equibit'] },

    issuanceUnit: { type: String, enum: ['SHARES', 'BTC', 'UNITS'] },

    // status: { type: String, enum: [ 'Trading' ] }, // for Buy & Sell
    txIdBtc: { type: String }, // Buy & Sell?
    txIdEqb: { type: String }, // Buy & Sell?
    // quantity: { type: Number }, // Integer

    // TODO: Validate the amount.
    amount: { type: Number, required: true }, // Integer
    fee: { type: Number, required: true },

    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('transactions', transactions)
}
