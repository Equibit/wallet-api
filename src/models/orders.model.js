// orders-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { ObjectId } = mongooseClient.Schema.Types
  const orders = new mongooseClient.Schema({
    userId: { type: ObjectId, required: true },
    type: { type: String, required: true },

    // For HTLC we need 2 or 3 addresses:
    // - Sell order:
    //    1. btcAddress for receiving payment from a buyer.
    //    2. eqbAddress for a refund (a holding address).
    // - Buy order:
    //    1. eqbAddress (trading) for receiving securities from a seller.
    //    2. btcAddress for our own refund.
    //    3. eqbAddress (holding) to store the securities in the end.
    btcAddress: { type: String },
    eqbAddressTrading: { type: String },
    eqbAddressHolding: { type: String },

    timelock: { type: Number },

    // BTC address for SELL type of order where a buyer should send funds.
    // sellAddressBtc: { type: String },
    // EQB address for BUY type of order where a seller should send securities.
    // buyAddressEqb: { type: String },

    portfolioId: { type: String, required: true },

    // Number of units:
    quantity: { type: Number, required: true },

    // Price of one unit of the issuance, in Satoshi:
    price: { type: Number, required: true },

    isFillOrKill: { type: Boolean, required: true },
    goodFor: { type: Number, required: true },
    status: { type: String, enum: [ 'OPEN', 'TRADING', 'CANCELLED', 'CLOSED' ] },

    // Issuance info:
    issuanceId: { type: String, required: true },
    issuanceAddress: { type: String, required: true },
    issuanceName: { type: String },
    issuanceType: { type: String },
    companyName: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('orders', orders)
}
