const { getByDot } = require('feathers-hooks-common')

const defaults = {
  txIdPath: 'result.txId',
  fieldsToUpdate: {}
}

module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  return function (hook) {
              // Add issuanceId to transaction and save it:
    return hook.app.service('/transactions').find({
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

      return Promise.all(
        result.data.map(tx => {
          return hook.app.service('/transactions').patch(tx._id, patchSet)
        })
      ).then(() => hook)
    })
  }
}
