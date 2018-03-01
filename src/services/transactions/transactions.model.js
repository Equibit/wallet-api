// transactions-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { ObjectId } = mongooseClient.Schema.Types
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
    // MUST BE SENT FROM BROWSER
    // Validate that toAddress made it into the vout addresses
    fromAddress: { type: String },
    toAddress: { type: String },

    // HTLC flow consists of 4 steps.
    htlcStep: { type: Number, enum: [1, 2, 3, 4] },

    // Refund address for HTLC transaction
    refundAddress: { type: String },

    // Timelock for HTLC (number of blocks)
    timelock: { type: Number },

    // Hashlock for HTLC
    hashlock: { type: String },

    type: { type: String, enum: [ 'OUT', 'IN', 'BUY', 'SELL', 'TRANSFER', 'AUTH', 'CANCEL' ], required: true },
    currencyType: { type: String, enum: [ 'BTC', 'EQB', 'BOTH' ], required: true },

    companyName: { type: String },
    companySlug: { type: String },
    issuanceId: { type: ObjectId },
    issuanceName: { type: String },

    // The values are defined by the Core:
    issuanceType: { type: String, enum: ['common_shares', 'bonds', 'preferred_shares', 'fund_units', 'trust_units', 'bitcoin', 'equibit'] },

    issuanceUnit: { type: String, enum: ['SHARES', 'BTC', 'UNITS'] },

    // status: { type: String, enum: [ 'Trading' ] }, // for Buy & Sell
    txId: { type: String }, // Buy & Sell?
    // quantity: { type: Number }, // Integer

    // TODO: Validate the amount.
    amount: { type: Number, required: true }, // Integer
    fee: { type: Number },

    // Use offer ID when tx is part of an HTLC atomic swap
    offerId: { type: ObjectId },
    // offer.price at time of purchase
    costPerShare: { type: Number },

    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('transactions', transactions)
}
