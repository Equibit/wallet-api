const { getByDot } = require('feathers-hooks-common')

const defaults = {
  txIdPath: 'result.txId',
  fieldsToUpdate: {}
}

module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  return function (hook) {
    // Don't block the hooks while this is processing.  We want this hook to complete
    //  before the transaction is updated.
    hook.app.service('/transactions').find({
      query: {
        txId: getByDot(hook, options.txIdPath)
      }
    }).then(result => {
      const patchSet = Object.keys(options.fieldsToUpdate).reduce((patches, patchKey) => {
        let patchValue
        if (typeof options.fieldsToUpdate[patchKey] === 'function') {
          patchValue = options.fieldsToUpdate[patchKey](hook)
        } else {
          patchValue = getByDot(hook, options.fieldsToUpdate[patchKey])
        }
        patches[patchKey] = patchValue
        return patches
      }, {})

      result.data.forEach(tx => {
        hook.app.service('/transactions').patch(tx._id, patchSet)
      })
    })
    return hook
  }
}
