const errors = require('feathers-errors')

class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    return Promise.resolve(params)
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    })
  }

  create (data, params) {
    const { app } = this.options
    const proxycoreService = app.service('proxycore')
    const sendPromise = proxycoreService.find({
      query: {
        node: data.node,
        method: 'sendrawmessage',
        params: [data.message]
      }})
      .then(data => {
        return Promise.resolve(data)
      })
      .catch(err => {
        const errRes = (err.response && err.response.data) || {
          message: err.message
        }
        console.log('_______ PROXY ERROR: ', errRes)
        throw new errors.GeneralError(errRes)
      })

    return sendPromise
  }

  update (id, data, params) {
    return Promise.resolve(data)
  }

  patch (id, data, params) {
    return Promise.resolve(data)
  }

  remove (id, params) {
    return Promise.resolve({ id })
  }
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
