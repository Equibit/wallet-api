// questionaire-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const questionaire = new Schema({
    question: { type: String, required: true },
    sortIndex: { type: Number },
    questionType: { type: String, enum: ['SINGLE', 'MULTI', 'DROPDOWN'], default: 'SINGLE' },
    // Array of strings. `CUSTOM` is reserved for "Other - Specify" answers.
    answerOptions: { type: Array }
  }, {
    timestamps: true
  })

  return mongooseClient.model('questionaire', questionaire)
}
