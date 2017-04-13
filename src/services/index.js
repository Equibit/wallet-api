'use strict';

const users = require('./users/users.service');
const issuances = require('./issuances/issuances.service');
const postmark = require('./postmark-messages');
const forgotPassword = require('./forgot-password/forgot-password.service');

module.exports = function () {
  const app = this;
  app.configure(users);
  app.configure(issuances);
  app.configure(postmark);
  app.configure(forgotPassword);
};
