module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const { ObjectId } = mongooseClient.Schema.Types
  const AddressMeta = new Schema({
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

  const compoundIndex = {
    portfolioId: 1,
    index: 1,
    type: 1,
    isChange: 1
  }
  AddressMeta.index(compoundIndex, { unique: true, name: 'compound addresses meta index' })

  return mongooseClient.model('portfolioAddresses', AddressMeta)
}
