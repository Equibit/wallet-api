// Normalize the response to just the email.
module.exports = function () {
  return hook => {
    return new Promise(resolve => {
      hook.result = { email: hook.data.email }
      resolve(hook)
    })
  }
}
