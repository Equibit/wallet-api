// user-answers-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const ObjectId = mongooseClient.SchemaTypes.ObjectId
  const { Schema } = mongooseClient
  const userAnswers = new Schema({
    questionnaireId: { type: ObjectId, required: true },
    answers: [{ type: mongooseClient.SchemaTypes.Mixed }]
  }, {
    timestamps: true
  })
  return mongooseClient.model('userAnswers', userAnswers)
}
