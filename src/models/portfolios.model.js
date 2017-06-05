// portfolios-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const portfolios = new mongooseClient.Schema({
    name: { type: String, required: true },
    portfolioIndex: { type: Number, required: true },
    balance: { type: Number, required: true },
    totalCash: { type: Number, required: true },
    totalSecurities: { type: Number, required: true },
    unrealizedPL: { type: Number, required: true },
    unrealizedPLPercent: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('portfolios', portfolios)
}
