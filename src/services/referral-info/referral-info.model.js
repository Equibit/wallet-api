// referral-info-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const ObjectId = mongooseClient.SchemaTypes.ObjectId
  const referralInfo = new Schema({
    referralCodeId: { type: ObjectId, required: true },
    // User email used with code on account creation
    email: { type: String }
  }, {
    timestamps: true
  })

  return mongooseClient.model('referralInfo', referralInfo)
}
