'use strict'

const authentication = require('feathers-authentication')
const jwt = require('feathers-authentication-jwt')
const signed = require('feathers-authentication-signed')
const { iff } = require('feathers-hooks-common')
const pick = require('lodash.pick')
const verifyFailedLoginEmail = require('./hooks/failed-logins.verify')
const sendFailedLoginEmail = require('./hooks/failed-logins.email')
// const makeCryptoUtils = require('feathers-authentication-signed/');

const refreshUser = () => hook => {
  const userService = hook.app.service('users')
  const email = (hook.params.user && hook.params.user.email) || hook.data.email
  // lookup the user by email.
  if (email) {
    return userService.find({ query: {email} })
      .then(({ data }) => {
        hook.params.user = data[0]
        return hook
      })
  } else {
    return Promise.resolve(hook)
  }
}

module.exports = function () {
  const app = this
  const config = app.get('authentication')
  const outboundEmail = app.get('outboundEmail')
  const emailTemplates = app.get('postmarkTemplateIds')

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
        // Update the hook.params.user with the latest data.
        // This is a workaround for Feathers Auth bug not updating the hook.params.user over socket.io
        // https://github.com/feathersjs/feathers-authentication/issues/293
        refreshUser(),
        // Flag response with usingTempPassword, if applicable.
        iff(
          hook => hook.data.strategy === 'challenge',
          hook => {
            if (hook.params.usingTempPassword && hook.params.user.tempPassword) {
              hook.result.usingTempPassword = true
            }
            hook.result.user = hook.params.user
            delete hook.result.user.password
            delete hook.result.user.tempPassword
            delete hook.result.user.salt
            delete hook.result.user.challenge
            delete hook.result.user.failedLogins
            delete hook.result.user.pastPasswordHashes
            return hook
          }
        ),
        // Log all login attempts
        hook => {
          return hook.app.service('login-attempts').create({
            data: hook.data,
            status: 'SUCCESS'
          }).then(() => hook)
        }
      ]
    },
    error: {
      create: [
        refreshUser(),
        // Check if this is the third failed login, today, for this user.
        iff(
          hook => hook.params.user && hook.data.strategy === 'challenge',
          // Send a notification at most every 6 hours.
          verifyFailedLoginEmail({
            failureCount: 3,
            timeBetweenEmails: 6 * 60 * 60 * 1000
          }),
          iff(
            hook => hook.app.get('postmark').key !== 'POSTMARK_API_TEST' && hook.params.notifyFailedLogins,
            sendFailedLoginEmail({
              From: outboundEmail,
              TemplateId: emailTemplates.securityAlertFailedLogins
            })
          )
        ),
        // Log all login attempts
        hook => {
          const error = pick(hook.error, ['className', 'code', 'message', 'name', 'type'])
          return hook.app.service('login-attempts').create({
            data: hook.data,
            error,
            status: 'FAILURE'
          }).then(() => {
            return hook
          })
        }
      ]
    }
  })
}
