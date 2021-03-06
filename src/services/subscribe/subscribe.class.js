const errors = require('feathers-errors')
const assert = require('assert')

/*
When the user logs in, the UI needs a way to know when transactions occur on addresses.
The UI will send a list of addresses.  This service creates an address-map record for each
of the addresses so that the `offers` and `transactions` services can determine which connected
clients should receive the realtime socket notification.
*/
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
    // const { user } = params
    // console.log('[/subscribe]', data.addresses)

    if (Array.isArray(data)) {
      data = { addresses: data }
    }

    if (!Array.isArray(data.addresses) || !data.addresses.length) {
      throw new errors.BadRequest('No addresses were provided. An object with an array of `addresses` must be provided.')
    }

    // Find this user's socketObject
    const socketId = Object.keys(app.io.sockets.sockets).reduce((acc, socketId) => {
      let socketFeathers = app.io.sockets.sockets[socketId].feathers
      if (!acc && socketFeathers.uid === params.uid) {
        acc = socketId
      }
      return acc
    }, null)
    assert(socketId, 'A socket was found that matches this connection')
    const socketFeathers = app.io.sockets.sockets[socketId].feathers

    socketFeathers.addresses = socketFeathers.addresses || {}
    data.addresses.forEach(address => {
      socketFeathers.addresses[address] = true
    })

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
