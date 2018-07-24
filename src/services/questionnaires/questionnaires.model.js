// questionnaires-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const questionnaires = new Schema({
    description: { type: String, required: true },
    isActive: { type: Boolean },
    reward: { type: Number }
  }, {
    timestamps: true
  })

  return mongooseClient.model('questionnaires', questionnaires)
}
