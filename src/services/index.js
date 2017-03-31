'use strict';

const users = require('./users/users.service.js');

const postmarks = require('./postmarks/postmarks.service.js');

module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(users);
  app.configure(postmarks);
};
