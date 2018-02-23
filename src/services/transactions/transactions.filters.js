module.exports = function (data, connection, hook) {
  const { addressMap } = hook.params

  if (addressMap && connection.addresses && connection.addresses[addressMap.address]) {
    return data
  } else {
    return false
  }
}
