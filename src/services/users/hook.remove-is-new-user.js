module.exports = function () {
  return hook => {
    return new Promise(resolve => {
      hook.data.isNewUser = false
      resolve(hook)
    })
  }
}
