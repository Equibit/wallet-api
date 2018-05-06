'use strict'

// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const ObjectId = mongooseClient.SchemaTypes.ObjectId
  const issuances = new mongooseClient.Schema({
    // Issuer user id (user who created/authorized the issuance):
    userId: { type: ObjectId, required: true },
    // Indexes for bip44 key generation:
    index: { type: Number, required: true },
    companyIndex: { type: Number, required: true },
    // TXID of the authorization transaction:
    issuanceTxId: { type: String, required: true },
    issuanceAddress: { type: String, required: true },

    companyId: { type: ObjectId, required: true },
    companyName: { type: String, required: true },
    companySlug: { type: String, required: true },
    domicile: { type: String, required: true },
    issuanceName: { type: String, required: true },
    issuanceType: { type: String, required: true },
    restriction: { type: String },

    marketCap: { type: Number },
    change: { type: Number },
    changePercentage: { type: Number },

    // 24h stat data:
    highestBid: { type: Number },
    lowestAsk: { type: Number },
    highestNumShares: { type: Number },
    lowestNumShares: { type: Number },

    // meta data:
    volume24h: { type: Number },
    sharesAuthorized: { type: Number },
    sharesIssued: { type: Number, default: 0 },
    sharesDividend: { type: Number },
    sharesDividendYield: { type: Number },

    // Most Active component:
    tradesNum: { type: Number }
  }, {
    versionKey: false
  })

  return mongooseClient.model('issuances', issuances)
}
