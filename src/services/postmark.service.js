const postmark = require('feathers-postmark');

module.exports = function () {
  const app = this;
  const options = app.get('postmark');

  app.use('postmark-messages', postmark(options));
};
