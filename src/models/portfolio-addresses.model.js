module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const { ObjectId } = mongooseClient.Schema.Types
  const addressMeta = new Schema({
    portfolioId: { type: ObjectId, required: true },
    index: { type: Number, required: true },
    type: { type: String, required: true }, // EQB or BTC
    isChange: { type: Boolean, default: false },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    timestamps: true
  })

  return mongooseClient.model('portfolioAddresses', addressMeta)
}
