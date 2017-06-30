console.warn('You are using the default filter for the transactions service. For more information about event filters see https://docs.feathersjs.com/api/events.html#event-filtering')

module.exports = function (data, connection, hook) {
  const { addressMap } = hook.params

  if (connection.uid === addressMap.identifier) {
    return data
  } else {
    return false
  }
}
