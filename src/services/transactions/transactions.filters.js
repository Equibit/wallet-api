module.exports = function (data, connection, hook) {
  // TODO: review and complete.
  // We have two privacy cases here:
  // 1. Some tx may be publicly revealed (e.g. a trade)
  // 2. Some tx should not be publicly tracked (e.g. direct transfer)
  // For case #1 we can subscribe to tx address directly.
  // For case #2 we need to protect user and subscribe to an encrypted address so that its not possible to connect user to a transaction when an intruder gets access to this scope (connection.addresses).

  // const { addressMap } = hook.params
  // if (addressMap && connection.addresses && connection.addresses[addressMap.address]) {

  if (connection.addresses && (connection.addresses[ data.fromAddress ] || connection.addresses[ data.toAddress ])) {
    // console.log(`+TRANSACTION FILTER: OK found. data.address=${data.address}`)
    return data
  } else {
    return false
  }
}
