module.exports = function (data, connection, hook) { // eslint-disable-line no-unused-vars
  const { addressMap } = hook.params

  if (addressMap && connection.addresses && connection.addresses[addressMap.address]) {
    return data
  } else {
    return false
  }
}
