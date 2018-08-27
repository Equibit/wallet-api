// blockchain-info-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const blockchainInfo = new Schema({
    coinType: { type: String, enum: [ 'BTC', 'EQB' ], unique: true, required: true },
    mode: { type: String, enum: [ 'regtest', 'test', 'main', 'unknown' ], required: true },
    status: { type: Boolean },
    currentBlockHeight: { type: Number },
    bestblockhash: { type: String },
    difficulty: { type: Number },
    mediantime: { type: Number },
    relayfee: { type: Number },
    feeRates: { type: Object },
    errorMessage: { type: String }
  }, {
    timestamps: true
  })

  return mongooseClient.model('blockchainInfo', blockchainInfo)
}
