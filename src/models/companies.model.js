'use strict';

// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const companies = new mongooseClient.Schema({
    name: {type: String},
    slug: {type: String},
    issuances: []
  }, {
    versionKey: false
  });

  return mongooseClient.model('companies', companies);
};
