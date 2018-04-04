const { getByDot } = require('feathers-hooks-common')

// One of userIdPath or addressPath is required.
// If the addressPath is used, the address map will be used.
const defaults = {
  addressPath: null,
  type: null,
  fields: {
    _id: '_id'
  }
}

module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  return hook => {
    const app = hook.app
    const service = app.service('/notifications')

    const data = Object.keys(options.fields).reduce((data, key) => {
      const typeOfField = typeof options.fields[key]
      if (typeOfField === 'string') {
        data[key] = getByDot(hook, options.fields[key])
      } else if (typeOfField === 'function') {
        data[key] = options.fields[key].call(null, hook)
      }
      return data
    }, {})

    service.create({
      address: typeof options.addressPath === 'string'
        ? getByDot(hook, options.addressPath)
        : options.addressPath.call(null, hook),
      type: options.type || hook.service.path,
      isRead: false,
      data
    }).catch(console.error.bind(console))

    return hook
  }
}
