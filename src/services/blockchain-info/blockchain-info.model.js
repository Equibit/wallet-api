// blockchain-info-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const blockchainInfo = new Schema({
    type: { type: String, enum: [ 'BTC', 'EQB' ], required: true },
    mode: { type: String, enum: [ 'regtest', 'test', 'main' ], required: true },
    status: { type: Boolean },
    currentBlockHeight: { type: Number }
  }, {
    timestamps: true
  })

  return mongooseClient.model('blockchainInfo', blockchainInfo)
}
