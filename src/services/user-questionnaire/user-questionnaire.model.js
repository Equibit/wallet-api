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
    status: { type: String, enum: ['STARTED', 'COMPLETED', 'REWARDED'], required: true },
    answers: [{ type: mongooseClient.SchemaTypes.Mixed }]
    // started: { type: Boolean, default: false, required: true },
    // completed: { type: Boolean, default: false, required: true },
    // rewarded: { type: Boolean }
  }, {
    timestamps: true
  })

  return mongooseClient.model('userQuestionnaire', userQuestionnaire)
}
