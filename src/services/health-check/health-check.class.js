const packageJson = require('../../../package.json')

const dbReadyStateCodes = ['disconnected', 'connected', 'connecting', 'disconnecting']

/* eslint-disable no-unused-vars */
class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    return Promise.resolve([])
  }

  get (id, params) {
    if (id !== '12345') {
      return Promise.resolve({message: 'reauires auth'})
    }
    const app = this.options.app
    const mongooseClient = app.get('mongooseClient')
    const connection = mongooseClient.connection
    // const config = {
    //   mongodb: app.get('mongodb').substring(0,10) + '...'
    // }
    return Promise.resolve({
      version: packageJson.version,
      //config,
      db: {
        mongooseVersion: mongooseClient.version,
        readyState: connection.readyState,
        readyStateCode: dbReadyStateCodes[connection.readyState]
        //host: connection.host || 'null',
        //port: connection.port || 'null',
        //databaseName: (connection.db && connection.db.databaseName)
      }
    })
  }

  create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current)))
    }

    return Promise.resolve(data)
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
