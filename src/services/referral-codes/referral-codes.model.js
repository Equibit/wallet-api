// referral-codes-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { ObjectId } = mongooseClient.Schema.Types
  const { Schema } = mongooseClient
  const referralCodes = new Schema({
    userId: { type: ObjectId, required: true, unique: true },
    // userEmail used for easy deletion after tests
    userEmail: { type: String, unique: true },
    referralCode: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now }
  }, {
    timestamps: true
  })

  return mongooseClient.model('referralCodes', referralCodes)
}
