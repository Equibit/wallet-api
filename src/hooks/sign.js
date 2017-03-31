const createHmac = require('create-hmac');
const btoa = require('btoa');

/**
 * Must create hook.params.secret, first.
 */
module.exports = function sign (hook) {
  /**
   * hook.data = {
   *   email,
   *   timestamp,
   *   url
   * }
   */
  let data = JSON.stringify(hook.data);
  let hmac = createHmac('sha512', new Buffer(hook.params.secret));

  hmac.update(data);

  let digest = hmac.digest();

  hook.data.signature = btoa(digest);
};
