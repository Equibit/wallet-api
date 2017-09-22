/* eslint no-console: 1 */
console.warn('You are using the default filter for the portfolios service. For more information about event filters see https://docs.feathersjs.com/api/events.html#event-filtering') // eslint-disable-line no-console

module.exports = function (data, connection, hook) { // eslint-disable-line no-unused-vars
  if (connection.user._id.toHexString() === data.userId.toHexString()) {
    return data
  }
  return false
}
