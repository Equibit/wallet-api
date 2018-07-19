// referral-info-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const referralInfo = new Schema({
    referralCode: { type: String, required: true },
    timeCreated: { type: Date, required: true },
    email: { type: String }
  }, {
    timestamps: true
  })

  return mongooseClient.model('referralInfo', referralInfo)
}
