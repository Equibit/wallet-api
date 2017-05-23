module.exports = function () {
  return hook => {
    hook.data.tempPassword = undefined
    return Promise.resolve(hook)
  }
}
