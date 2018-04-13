// offers-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

function issuanceRequired () {
  return !this.assetType || this.assetType === 'ISSUANCE'
}

module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { ObjectId } = mongooseClient.Schema.Types
  const offers = new mongooseClient.Schema({
    userId: { type: ObjectId, required: true },
    orderId: { type: ObjectId, required: true },
    type: { type: String, enum: [ 'SELL', 'BUY' ], required: true },
    assetType: { type: String, enum: ['ISSUANCE', 'EQUIBIT'], default: 'ISSUANCE'},
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: [ 'OPEN', 'TRADING', 'CANCELLED', 'CLOSED' ] },
    isAccepted: { type: Boolean, default: false },

    // Issuance info:
    issuanceId: { type: ObjectId, required: issuanceRequired },
    issuanceAddress: { type: String, required: issuanceRequired },
    companyName: { type: String },
    issuanceName: { type: String },
    issuanceType: { type: String },

    // HTLC:
    secretEncrypted: { type: String },
    secret: { type: String }, // Plain secret after it was revealed in tx #3.
    hashlock: { type: String, required: true },
    // Timelock for HTLC1 (post offer):
    timelock: { type: Number, required: true },
    // Timelock for HTLC2 (accept offer):
    timelock2: { type: Number },

    // The blockheight at which the timelocks expire:
    //  (timelock + htlcTx1.confirmationBlockHeight)
    //  (timelock2 + htlcTx2.confirmationBlockHeight)
    //  These are set downstream from when confirmationBlockHeight is set on the
    timelockExpiresBlockheight: { type: Number },
    timelock2ExpiresBlockheight: { type: Number },
    // When these timelocks expired (timestamps)
    // These also function to mark whether the timelocks have expired (values set = expired, unset = not expired)
    timelockExpiredAt: { type: Date },
    timelock2ExpiredAt: { type: Date },

    htlcStep: { type: Number },
    htlcTxId1: { type: String },
    htlcTxId2: { type: String },
    htlcTxId3: { type: String },
    htlcTxId4: { type: String },

    // For HTLC we need 2 or 3 addresses:
    // - Buy offer:
    //    1. btcAddress for our own refund.
    //    2. eqbAddress for receiving securities from a seller.
    // - Sell offer:
    //    1. eqbAddress for a refund.
    //    2. btcAddress for receiving payment from a buyer.
    btcAddress: { type: String, required: true },
    eqbAddress: { type: String, required: true },

    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('offers', offers)
}
