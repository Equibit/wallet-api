const createHmac = require('create-hmac');
const btoa = require('btoa')

module.exports = function sign(hook) {
  let { signature, ...data } = hook.data
  let dataString = JSON.stringify(data)
  let hmac = createHmac('sha512', new Buffer(hook.params.accessToken))

  hmac.update(data)

  let digest = hmac.digest()
  
   = btoa(digest)
}
