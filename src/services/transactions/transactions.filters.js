console.warn('You are using the default filter for the transactions service. For more information about event filters see https://docs.feathersjs.com/api/events.html#event-filtering')

module.exports = function (data, connection, hook) {
  const { addressMap } = hook.params

  if (addressMap && addressMap.identifier === connection.uid) {
    return data
  } else {
    return false
  }
}
