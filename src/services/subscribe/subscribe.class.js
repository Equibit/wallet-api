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
    console.log('[/subscribe]', data.addresses)

    if (Array.isArray(data)) {
      data = { addresses: data }
    }

    if (!Array.isArray(data.addresses) || !data.addresses.length) {
      throw new errors.BadRequest('No addresses were provided. An object with an array of `addresses` must be provided.')
    }

    // Find this user's socketObject
    const socketId = Object.keys(app.io.sockets.sockets).reduce((acc, socketId) => {
      let socketFeathers = app.io.sockets.sockets[socketId].feathers
      if (!acc && socketFeathers.user && socketFeathers.user._id && user._id &&
        socketFeathers.user._id.toString() === user._id.toString()
      ) {
        acc = socketId
      }
      return acc
    }, null)
    assert(socketId, 'A socket was found that matches this connection')
    const socketFeathers = app.io.sockets.sockets[socketId].feathers

    // Use the uid to create `/address-map` pairs.
    const addressMapService = app.service('address-map')
    const mappingCreates = data.addresses.map(address => {
      return addressMapService.create({
        identifier: socketFeathers.uid,
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
