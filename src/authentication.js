'use strict'

const authentication = require('feathers-authentication')
const jwt = require('feathers-authentication-jwt')
const signed = require('feathers-authentication-signed')
const { iff } = require('feathers-hooks-common')
// const makeCryptoUtils = require('feathers-authentication-signed/');

module.exports = function () {
  const app = this
  const config = app.get('authentication')

  // Set up authentication with the secret
  app.configure(authentication(config))
  app.configure(jwt())
  app.configure(signed({
    idField: '_id'
  }))

  // The `authentication` service is used to create a JWT.
  // The before `create` hook registers strategies that can be used
  // to create a new valid JWT (e.g. local or oauth2)
  app.service('authentication').hooks({
    before: {
      create: [
        authentication.hooks.authenticate(config.strategies)
      ],
      remove: [
        authentication.hooks.authenticate('jwt')
      ]
    },
    after: {
      create: [
        // Flag response with usingTempPassword, if applicable.
        iff(
          hook => hook.data.strategy === 'challenge',
          hook => hook.app.service('/users').get(hook.params.user._id)
            .then(user => {
              if (hook.params.usingTempPassword && user.tempPassword) {
                hook.result.usingTempPassword = true
              }
              hook.result.user = user
              delete hook.result.user.password
              delete hook.result.user.tempPassword
              delete hook.result.user.salt
              delete hook.result.user.challenge
              return hook
            })
        )
      ]
    },
    error: {
      create: [
        function (hook) {
          console.log(hook)
        }
      ]
    }
  })
}
