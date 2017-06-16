// portfolios-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { ObjectId } = mongooseClient.Schema.Types
  const portfolios = new mongooseClient.Schema({
    name: { type: String, required: true },
    index: { type: Number, required: false },
    xPub: { type: String },
    balance: { type: Number },
    totalCash: { type: Number },
    totalSecurities: { type: Number },
    unrealizedPL: { type: Number },
    unrealizedPLPercent: { type: Number },
    userId: { type: ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    addressesMeta: [{
      index: { type: Number, required: true },
      type: { type: String, required: true }, // EQB or BTC
      isChange: { type: Boolean, default: false },
      isUsed: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }]
  }, {
    timestamps: true
  })

  return mongooseClient.model('portfolios', portfolios)
}
