const errors = require('feathers-errors')
const assert = require('assert')

class Service {
  constructor (options) {
    this.options = options || {}
    this.app = options.app
  }

  find () {
    return new errors.NotImplemented()
  }

  get () {
    return new errors.NotImplemented()
  }

  create (data, params) {
    const app = this.app
    const { user } = params

    if (Array.isArray(data)) {
      data = { addresses: data }
    }

    if (!Array.isArray(data.addresses) || !data.addresses.length) {
      throw new errors.BadRequest('No addresses were provided. An object with an array of `addresses` must be provided.')
    }

    // Find this user's socketObject
    const socketId = Object.keys(app.io.sockets.sockets).filter(socketId => {
      return app.io.sockets.sockets[socketId].feathers.user._id.toString() === user._id.toString()
    })
    const socketObject = app.io.sockets.sockets[socketId].feathers
    assert(socketId, 'A socket was found that matches this user')

    // Merge in any provided addresses
    if (!socketObject.addresses) {
      socketObject.addresses = {}
    }
    socketObject.addresses = data.addresses.reduce((map, address) => {
      map[address] = true
      return map
    }, socketObject.addresses)

    return Promise.resolve(data)
  }

  update () {
    return new errors.NotImplemented()
  }

  patch () {
    return new errors.NotImplemented()
  }

  remove (id, params) {
    return Promise.resolve({ id })
  }
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
