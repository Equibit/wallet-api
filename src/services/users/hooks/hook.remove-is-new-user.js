module.exports = function () {
  return hook => {
    hook.data.isNewUser = false
    return Promise.resolve(hook)
  }
}
