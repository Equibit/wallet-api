'use strict'

// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const ObjectId = mongooseClient.SchemaTypes.ObjectId
  const issuances = new mongooseClient.Schema({
    userId: { type: ObjectId },
    index: { type: Number },

    companyId: { type: ObjectId },
    companyName: { type: String },
    companySlug: { type: String },
    domicile: { type: String },
    issuanceName: { type: String },
    issuanceType: { type: String },
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
    sharesIssued: { type: Number },
    sharesDividend: { type: Number },
    sharesDividendYield: { type: Number },

    // Most Active component:
    tradesNum: { type: Number }
  }, {
    versionKey: false
  })

  return mongooseClient.model('issuances', issuances)
}
