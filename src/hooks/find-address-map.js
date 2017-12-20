const { decrypt } = require('../utils/iv-encrypt')
const { getByDot } = require('feathers-hooks-common')

const defaults = {
  key: undefined,
  from: 'data.address' // the exact location in context, using dot notated string
}

module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  const { key, from } = options

  if (!key) {
    throw new Error('An encryption key must be passed as the `key` to the findAddressMap hook')
  }

  return function findAddressMap (context) {
    const { app } = context
    const address = getByDot(context, from)

    if (address) {
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
    } else {
      return Promise.resolve(context)
    }
  }
}
