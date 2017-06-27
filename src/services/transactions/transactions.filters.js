/* eslint no-console: 1 */
console.warn('You are using the default filter for the transactions service. For more information about event filters see https://docs.feathersjs.com/api/events.html#event-filtering') // eslint-disable-line no-console

module.exports = function (data, connection, hook) {
  if (connection.addresses[data.address]) {
    return data
  } else {
    return false
  }
}
