// login-attempts-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const Mixed = mongooseClient.Schema.Types.Mixed
  const loginAttempts = new mongooseClient.Schema({
    data: { type: Mixed },
    connection: { type: Mixed },
    error: { type: Mixed },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  return mongooseClient.model('loginAttempts', loginAttempts)
}
