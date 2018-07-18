'use strict'

const normalizeResponse = require('./hooks/hook.normalize-response')
const { iff } = require('feathers-hooks-common')
const createTemporaryPassword = require('../users/hooks/hook.create-temp-password')
const retrieveSalt = require('./hooks/hook.retrieve-salt')
const sendForgotPasswordEmailForExistingUser = require('./hooks/hook.email.forgot-existing')
const sendForgotPasswordEmailForMissingUser = require('./hooks/hook.email.forgot-missing')
const { hashPassword } = require('feathers-authentication-signed').hooks
const { pbkdf2 } = require('crypto')

module.exports = function () {
  const app = this
  const outboundEmail = app.get('outboundEmail')
  const emailTemplates = app.get('postmarkTemplateIds')

  // Initialize our service with any options it requires
  app.use('/forgot-password', {
    create (data, params) {
      let userId = params.user._id
      data = Object.assign({}, data)
      delete data.email
      return app.service('users').patch(userId, data)
    }
  })

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('forgot-password')

  service.hooks({
    before: {
      create: [
        // make sure user exists
        hook => {
          const userService = hook.app.service('users')

          return userService.find({query: {email: hook.data.email}})
            .then(users => {
              users = users.data || users
              const user = users[0]
              if (user) {
                hook.params.user = user
              }
              return hook
            })
        },
        iff(
          hook => hook.params.user,
          createTemporaryPassword({
            hashedPasswordField: 'tempPassword',
            plainPasswordField: 'tempPasswordPlain',
            timeStampField: 'tempPasswordCreatedAt'
          }),
          retrieveSalt(),
          hashPassword({ pbkdf2, passwordField: 'tempPassword' })
        ).else(
          // Sets hook.result to prevent the db request.
          normalizeResponse()
        )
      ]
    },
    after: {
      create: [
        iff(
          hook => hook.params.user && hook.app.get('postmark').key !== 'POSTMARK_API_TEST',
          sendForgotPasswordEmailForExistingUser({
            From: outboundEmail,
            TemplateId: emailTemplates.forgotPasswordExisting,
            tempPasswordField: 'tempPasswordPlain'
          })
        ).else(
          iff(
            hook => hook.app.get('postmark').key !== 'POSTMARK_API_TEST',
            sendForgotPasswordEmailForMissingUser({
              From: outboundEmail,
              TemplateId: emailTemplates.forgotPasswordNonExisting
            })
          )
        ),
        // Sets hook.result to make sure the response is deterministic.
        normalizeResponse()
      ]
    }
  })

  if (service.filter) {
    service.filter({
      // disable all events for this service by returning false
      all: [(data) => false],
      create: [],
      update: [],
      patch: [],
      remove: []
    })
  }
}
