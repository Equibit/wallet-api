const { authenticate } = require('feathers-authentication').hooks
const { restrictToOwner } = require('feathers-authentication-hooks')
const { iff, unless, discard, disallow, isProvider, lowerCase } = require('feathers-hooks-common')
const { generateSalt, hashPassword } = require('feathers-authentication-signed').hooks
const { randomBytes, pbkdf2 } = require('crypto')

const isExistingUser = require('./hook.is-existing-user')
const createTemporaryPassword = require('./hook.create-temp-password')
const removeIsNewUser = require('./hook.remove-is-new-user')
const removeTempPassword = require('./hook.remove-temp-password')
const enforcePastPasswordPolicy = require('./hook.password.past-policy')
const sendWelcomeEmail = require('./hook.email.welcome')
const sendDuplicateSignupEmail = require('./hook.email.duplicate-signup')

module.exports = function (app) {
  const outboundEmail = app.get('outboundEmail')
  const emailTemplates = app.get('postmarkTemplateIds')

  return {
    before: {
      all: [
        // call the authenticate hook before every method except 'create'
        unless(
          hook => hook.method === 'create',
          authenticate('jwt'),
          restrictToOwner({ idField: '_id', ownerField: '_id' })
        )
      ],
      find: [],
      get: [],
      create: [
        lowerCase('email'),
        // Sets `hook.params.existingUser` to the existing user.
        // Also sets hook.result to only contain the passed-in email.
        isExistingUser(),
        iff(
          hook => !hook.params.existingUser,
          // If the user has passed a password for account creation, delete it.
          discard('password'),
          createTemporaryPassword({ hashedPasswordField: 'tempPassword', plainPasswordField: 'tempPasswordPlain' }),
          generateSalt({ randomBytes }),
          hashPassword({ pbkdf2, passwordField: 'tempPassword', timeStampField: 'tempPasswordCreatedAt' })
        )
      ],
      update: [
        context => {
          return context.service.patch(context.id, context.data, context.params)
            .then(result => {
              context.result = result
              return context
            })
        }
      ],

      patch: [
        lowerCase('email'),
        // If a password is provided, hash it and generate a salt.
        iff(
          hook => hook.data && hook.data.password,
          enforcePastPasswordPolicy({
            oldPasswordsAttr: 'pastPasswordHashes',
            passwordCount: 3
          }),
          generateSalt({ randomBytes }),
          hashPassword({ randomBytes, pbkdf2 }),
          removeIsNewUser(),
          removeTempPassword()
        )
      ],
      remove: [
        disallow('external')
      ]
    },

    after: {
      all: [
        iff(
          isProvider('external'),
          discard('password', 'tempPassword', 'challenge', 'failedLogins', 'pastPasswordHashes'),
          // don't remove salt for update and patch
          iff(
            context => context.method !== 'update' && context.method !== 'patch',
            discard('salt')
          )
        )
      ],
      find: [],
      get: [],
      create: [
        // Only send emails if we're not using a test account.
        iff(
          hook => hook.app.get('postmark').key !== 'POSTMARK_API_TEST',
          iff(
            hook => hook.params.existingUser,
            sendDuplicateSignupEmail({
              From: outboundEmail,
              TemplateId: emailTemplates.duplicateSignup
            })
          ).else(
            sendWelcomeEmail({
              From: outboundEmail,
              TemplateId: emailTemplates.welcome,
              tempPasswordField: 'tempPasswordPlain'
            })
          )
        ),
        // Set the response to just the email, so there's no way for a malicious user
        // to know if this email address is already being used for another account.
        hook => {
          hook.result = { email: hook.data.email }
        }
      ],
      update: [],
      patch: [],
      remove: []
    },

    error: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  }
}
