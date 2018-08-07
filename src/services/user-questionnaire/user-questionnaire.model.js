// user-questionnaire-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const ObjectId = mongooseClient.SchemaTypes.ObjectId
  const userQuestionnaire = new Schema({
    questionnaireId: { type: ObjectId, required: true, unique: true },
    userId: { type: ObjectId, required: true },
    status: { type: String, enum: ['COMPLETED', 'REWARDED'], required: true, default: 'COMPLETED' },
    // status: { type: String, enum: ['STARTED', 'COMPLETED'], required: true, default: 'STARTED' },
    // rewarded: { type: Boolean, required: true, default: false },
    manualPaymentRequired: { type: Boolean, default: false }
  }, {
    timestamps: true
  })

  return mongooseClient.model('userQuestionnaire', userQuestionnaire)
}
