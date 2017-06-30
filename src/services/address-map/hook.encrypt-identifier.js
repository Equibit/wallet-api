const { encrypt } = require('../../utils/iv-encrypt')

module.exports = function (options) {
  const { key } = options

  if (!key) {
    throw new Error('The `encryptIdentifier` hook requires an encryption `key`')
  }

  return function encryptIdentifier (context) {
    context.data.identifier = encrypt(context.data.identifier, key)
  }
}
