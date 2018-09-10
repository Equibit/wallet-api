// orders-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

function issuanceRequired () {
  return !this.assetType || this.assetType === 'ISSUANCE'
}

module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { ObjectId } = mongooseClient.Schema.Types
  const orders = new mongooseClient.Schema({
    userId: { type: ObjectId, required: issuanceRequired },
    type: { type: String, enum: [ 'SELL', 'BUY' ], required: true },
    assetType: { type: String, enum: ['ISSUANCE', 'EQUIBIT'], default: 'ISSUANCE' },

    // For HTLC we need 2 or 3 addresses:
    // - Sell order:
    //    1. btcAddress for receiving payment from a buyer. Multiple offers!
    //    2. eqbAddress for a refund.
    // - Buy order:
    //    1. eqbAddress for receiving securities from a seller. The same addr for multiple offers is OK.
    //    2. btcAddress for our own refund. Must be separate for each offer.
    btcAddress: { type: String },
    eqbAddress: { type: String },

    timelock: { type: Number },

    portfolioId: { type: String, required: issuanceRequired },

    // Number of units, in satoshi:
    quantity: { type: Number, required: true },

    // Price of one (full) unit of the issuance, in Satoshi:
    price: { type: Number, required: true },

    isFillOrKill: { type: Boolean, required: true },
    goodFor: { type: Number, required: true },
    status: { type: String, enum: [ 'OPEN', 'TRADING', 'CANCELLED', 'CLOSED' ] },

    // Issuance info:
    issuanceId: { type: ObjectId, required: issuanceRequired },
    issuanceAddress: { type: String, required: issuanceRequired },
    issuanceName: { type: String },
    issuanceType: { type: String },
    companyName: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('orders', orders)
}
