const { getByDot } = require('feathers-hooks-common')

const defaults = {
  key: undefined,
  from: 'data.address' // the exact location in context, using dot notated string
}

module.exports = function (options) {
  options = Object.assign({}, defaults, options)

  const { from } = options

  return function getEventAddress (context) {
    // const { app } = context
    const address = getByDot(context, from)

    if (address) {
      context.params.addressMap = { address }
    } else {
      return Promise.resolve(context)
    }
  }
}
