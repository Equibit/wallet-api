'use strict'

const path = require('path')
const favicon = require('serve-favicon')
const compress = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const bodyParser = require('body-parser')

const feathers = require('feathers')
const configuration = require('feathers-configuration')
const hooks = require('feathers-hooks')
const rest = require('feathers-rest')
const socketio = require('feathers-socketio')

const middleware = require('./middleware')
const services = require('./services')
const appHooks = require('./hooks')

const authentication = require('./authentication')

const seed = require('./seeder/seeder')
const mongoose = require('./mongoose')
// const seedWriter = require('./seeder/seed-writer')

const app = feathers()
app.set('applicationRoot', path.join(__dirname))
// Load app configuration
app.configure(configuration(path.join(__dirname, '..')))

const addressMapEncryptionKey = app.get('addressMapEncryptionKey')
if (addressMapEncryptionKey === 'ADDRESS_MAP_ENCRYPTION_KEY') {
  throw new Error('the env.ADDRESS_MAP_ENCRYPTION_KEY was not found.')
}

// Enable CORS, security, compression, favicon and body parsing
app.use(cors())
app.use(helmet())
app.use(compress())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(favicon(path.join(app.get('public'), 'favicon.ico')))
// Host the public folder
app.use('/', feathers.static(app.get('public')))

// Set up Plugins and providers
app.configure(hooks())
app.configure(mongoose)
app.configure(rest())
app.use(function (req, res, next) {
  req.feathers.ip = req.ip
  next()
})
app.configure(socketio(function (io) {
  io.on('connection', function (socket) {
    Object.assign(socket.feathers, {headers: socket.handshake.headers})
    socket.feathers.ip = socket.conn.remoteAddress
  })
}, { timeout: app.get('socketTimeout') }))

app.configure(authentication)

// Set up our services (see `services/index.js`)
app.configure(services)

seed(app)
// seedWriter(app)

// Configure middleware (see `middleware/index.js`) - always has to be last
app.configure(middleware)
app.hooks(appHooks)

module.exports = app
