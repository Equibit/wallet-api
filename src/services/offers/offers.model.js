// offers-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { ObjectId } = mongooseClient.Schema.Types
  const offers = new mongooseClient.Schema({
    userId: { type: ObjectId, required: true },
    orderId: { type: ObjectId, required: true },
    type: { type: String, enum: [ 'SELL', 'BUY' ], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: [ 'OPEN', 'TRADING', 'CANCELLED', 'CLOSED' ] },
    isAccepted: { type: Boolean, default: false },

    // Issuance info:
    issuanceId: { type: String, required: true },
    issuanceAddress: { type: String, required: true },
    companyName: { type: String },
    issuanceName: { type: String },
    issuanceType: { type: String },

    // HTLC:
    secretEncrypted: { type: String },
    hashlock: { type: String, required: true },
    timelock: { type: Number, required: true },
    htlcStep: { type: Number },
    htlcTxId: { type: String },

    // For HTLC we need 2 or 3 addresses:
    // - Buy offer:
    //    1. btcAddress for our own refund.
    //    2. eqbAddress (trading) for receiving securities from a seller.
    //    3. eqbAddress (holding) to store the securities in the end.
    // - Sell offer:
    //    1. eqbAddress for a refund (a holding address).
    //    2. btcAddress for receiving payment from a buyer.
    btcAddress: { type: String, required: true },
    eqbAddressTrading: { type: String },  // Note: trading address is not required for for a SELL offer.
    eqbAddressHolding: { type: String, required: true },

    // EQB address to receive securities to for a BUY offer
    // eqbAddress: 'string',
    // BTC address to receive payment to for a SELL offer
    // btcAddress: 'string',
    // Refund address that will be used in HTLC transaction
    // refundEqbAddress: 'string',
    // refundBtcAddress: 'string',

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('offers', offers)
}
