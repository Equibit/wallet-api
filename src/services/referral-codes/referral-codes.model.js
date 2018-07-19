// referral-codes-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const referralCodes = new Schema({
    referralCode: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'disabled'] },
    description: { type: String }
  }, {
    timestamps: true
  })

  return mongooseClient.model('referralCodes', referralCodes)
}
