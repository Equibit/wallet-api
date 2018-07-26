// questions-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const ObjectId = mongooseClient.SchemaTypes.ObjectId
  const { Schema } = mongooseClient
  const answerOptions = new Schema({
    answer: { type: String, required: true },
    finalQuestion: { type: Boolean },
    skipTo: { type: Number }
  })

  const questions = new Schema({
    questionnaireId: { type: ObjectId, required: true },
    question: { type: String, required: true },
    sortIndex: { type: Number },
    questionType: { type: String, enum: ['SINGLE', 'MULTI', 'DROPDOWN'], default: 'SINGLE' },
    // Array of strings. `CUSTOM` is reserved for "Other - Specify" answers.
    answerOptions: [answerOptions]
  }, {
    timestamps: true
  })

  return mongooseClient.model('questions', questions)
}
