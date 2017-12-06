module.exports = function (data, connection, hook) { // eslint-disable-line no-unused-vars
  if (connection.user && data.userId && (connection.user._id.toHexString() === data.userId.toHexString())) {
    return data
  }
  return false
}
