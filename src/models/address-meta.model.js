// address-meta-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const addressMeta = new Schema({
    index: { type: Number, required: true },
    type: { type: String, required: true }, // EQB or BTC
    isChange: { type: Boolean, default: false },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    timestamps: true
  })

  return mongooseClient.model('addressMeta', addressMeta)
}
