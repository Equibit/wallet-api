'use strict';

// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const ObjectId = mongooseClient.SchemaTypes.ObjectId;
  const issuances = new mongooseClient.Schema({
    companyId: { type: ObjectId },
    companyName: { type: String },
    companySlug: { type: String },
    domicile: { type: String },
    issuance: { type: String },
    issuanceType: { type: String },
    restriction: { type: String },
    marketCap: { type: Number },
    change: { type: Number },
    changePercentage: { type: Number }
  }, {
    versionKey: false
  });

  return mongooseClient.model('issuances', issuances);
};
