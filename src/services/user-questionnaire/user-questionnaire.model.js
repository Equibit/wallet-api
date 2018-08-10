// user-questionnaire-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const ObjectId = mongooseClient.SchemaTypes.ObjectId
  const userQuestionnaire = new Schema({
    questionnaireId: { type: ObjectId, required: true },
    userId: { type: ObjectId, required: true },
    status: { type: String, enum: ['COMPLETED', 'MANUALREQUIRED', 'REWARDED'], required: true, default: 'COMPLETED' },
    locked: { type: Number, default: 0 },
    address: { type: String, required: false },
    error: { type: String, required: false }
  }, {
    timestamps: true
  })

  userQuestionnaire.index({ questionnaireId: 1, userId: 1 }, { unique: true })

  return mongooseClient.model('userQuestionnaire', userQuestionnaire)
}
