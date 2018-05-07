module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const txNotes = new mongooseClient.Schema({
    address: { type: String },
    description: { type: String },
    txId: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('transactionNotes', txNotes)
}
