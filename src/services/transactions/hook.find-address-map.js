const { decrypt } = require('../../utils/iv-encrypt')

module.exports = function (options) {
  const { key } = options

  if (!key) {
    throw new Error('An ecryption key must be passed as the `key` to the findAddressMap hook')
  }

  return function findAddressMap (context) {
    const { app, data } = context
    const { address } = data

    return app.service('address-map').find({ query: { address }, paginate: false })
      .then(result => {
        const map = result[0]
        if (map) {
          // Decrypt the identifier to get the socket.uid
          map.identifier = decrypt(map.identifier, key)
          context.params.addressMap = map
        }
        return context
      })
  }
}
