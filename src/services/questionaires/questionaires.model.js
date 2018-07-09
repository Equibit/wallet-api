// questionaires-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const Decimal128 = mongooseClient.SchemaTypes.Decimal128
  const { Schema } = mongooseClient
  const questionaires = new Schema({
    description: { type: String, required: true },
    status: { type: String, enum: ['active', 'closed'] },
    reward: { type: Decimal128 }
  }, {
    timestamps: true
  })

  return mongooseClient.model('questionaires', questionaires)
}
