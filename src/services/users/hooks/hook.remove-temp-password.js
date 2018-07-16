module.exports = function () {
  return hook => {
    hook.data.tempPassword = undefined
    hook.data.tempPasswordCreatedAt = undefined
    return Promise.resolve(hook)
  }
}
