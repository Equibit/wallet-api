const errors = require('feathers-errors')
const { iff } = require('feathers-hooks-common')

const defaults = {}

// The `mnemonicHash` value can be passed either for saving to db or for verification.
// - Allow to set mnemonicHash only when encrypted key and mnemonic are generated for the 1st time
// - Verify mnemonicHash and immediately return the result of verification.
module.exports = function (options = {}) {
  options = Object.assign({}, defaults, options)

  return iff(
    // Verification:
    hook => (hook.data && hook.user.mnemonicHash),
    hook => {
      if (hook.data.mnemonicHash === hook.user.mnemonicHash) {
        hook.result = {
          status: 0,
          message: 'Mnemonic was verified'
        }
      } else {
        throw new errors.BadRequest('Mnemonic is incorrect!')
      }
      return hook
    }
  ).else(
    // Saving value:
    iff(
      // Throw an error if its not the 1st time or if one of the encrypted values are missing in data:
      hook => {
        return hook.user.encryptedMnemonic
          || !(hook.data.encryptedKey && hook.data.encryptedMnemonic && hook.data.mnemonicHash)
      },
      hook => {
        // console.log(`*** ERROR: Cannot update mnemonic due to:
        //   user.encryptedMnemonic=${hook.user.encryptedMnemonic} (should be empty),
        //   data.mnemonicHash=${hook.data.mnemonicHash} (cannot be empty),
        //   data.encryptedKey=${hook.data.encryptedKey} (cannot be empty),
        //   data.encryptedMnemonic=${hook.data.encryptedMnemonic} (cant be empty)
        // `)
        throw new errors.BadRequest('You cannot update mnemonic hash!')
      }
    )
  )
}
