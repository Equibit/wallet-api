const errors = require('feathers-errors')
const assert = require('assert')
const objectid = require('objectid')
const { encrypt } = require('../../utils/iv-encrypt')

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
    const socket = app.io.sockets.sockets[socketId].feathers
    assert(socketId, 'A socket was found that matches this user')

    // Make sure the socket has a unique identifier
    socket.uid = socket.uid || objectid().toString()

    // Use the uid to create `/address-map` pairs.
    const addressMapService = app.service('address-map')
    const mappingCreates = data.addresses.map(address => {
      return addressMapService.create({
        identifier: socket.uid,
        address
      })
    })
    return Promise.all(mappingCreates).then(mappings => {
      return Promise.resolve(data)
    })
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
