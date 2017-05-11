'use strict'

const app = require('../src/app')

let server

before(done => {
  server = app.listen(3030)
  server.once('listening', () => {
    setTimeout(done, 500)
  })
})

after(done => {
  server.close()
  done()
})
