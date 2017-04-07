'use strict';

const users = require('./users/users.service');
const postmark = require('./postmark-messages');
const forgotPassword = require('./forgot-password/forgot-password.service');

module.exports = function () {
  const app = this;
  app.configure(users);
  app.configure(postmark);
  app.configure(forgotPassword);
};
