module.exports = function (data, connection, hook) {
  const { addressMap } = hook.params

  if (addressMap && addressMap.identifier === connection.uid) {
    return data
  } else {
    // todo: temporarily notify everybody.
    return data
    // return false
  }
}
