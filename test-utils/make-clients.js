const feathers = require('feathers/client')
const io = require('socket.io-client')
const superagent = require('superagent')
const rest = require('feathers-rest/client')
const socketio = require('feathers-socketio/client')
const auth = require('feathers-authentication-client')
const hooks = require('feathers-hooks')

function makeClient (transport = 'socketio') {
  const feathersClient = feathers()

  if (transport === 'socketio') {
    var socket = io('http://localhost:3030', {
      transports: ['websocket']
    })
    feathersClient.configure(socketio(socket))
  }
  if (transport === 'rest') {
    feathersClient.configure(rest('http://localhost:3030').superagent(superagent))
  }

  feathersClient.configure(hooks())
    .configure(auth())

  return feathersClient
}

module.exports = [
  makeClient('socketio'),
  makeClient('rest')
]
