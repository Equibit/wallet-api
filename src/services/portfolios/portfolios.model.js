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
    // when importing addresses ( https://bitcoin.org/en/developer-reference#importmulti ), 'importFrom' this is the timestamp argument
    importFrom: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
    // addressesMeta is array of 'portfolio-addresses' records
  }, {
    timestamps: true
  })

  return mongooseClient.model('portfolios', portfolios)
}
