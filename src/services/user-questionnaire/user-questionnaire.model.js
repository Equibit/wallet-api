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
    answers: [{ type: mongooseClient.SchemaTypes.Mixed }],
    status: { type: String, enum: ['STARTED', 'COMPLETED'], required: true, default: 'STARTED' },
<<<<<<< HEAD
<<<<<<< HEAD
    rewarded: { type: Boolean, required: true, default: false },
    locked: { type: Number, default: 0, required: true },
    manualPaymentRequired: { type: Boolean, default: false }
=======
    rewarded: { type: Boolean, required: true, default: false }

>>>>>>> fix conflicts
=======
    rewarded: { type: Boolean, required: true, default: false },
    locked: { type: Number, default: 0, required: true },
    manualPaymentRequired: { type: Boolean, default: false }
>>>>>>> 795b3ca9c73e4a7a0154b271f825dc354e370c7e
  }, {
    timestamps: true
  })

  return mongooseClient.model('userQuestionnaire', userQuestionnaire)
}
