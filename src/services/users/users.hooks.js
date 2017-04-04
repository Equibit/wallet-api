const { authenticate } = require('feathers-authentication').hooks;
const { iff, unless, discard, disallow } = require('feathers-hooks-common');
const { generateSalt, hashPassword } = require('feathers-authentication-signed').hooks;
const { randomBytes, pbkdf2 } = require('crypto');
const isExistingUser = require('./hook.is-existing-user');
const createTemporaryPassword = require('./hook.create-temp-password');
const sendWelcomeEmail = require('./hook.email.welcome');
const sendDuplicateSignupEmail = require('./hook.email.duplicate-signup');

module.exports = function (app) {
  const outboundEmail = app.get('outboundEmail');
  const emailTemplates = app.get('postmarkTemplateIds');

  return {
    before: {
      all: [
        // call the authenticate hook before every method except 'create'
        unless(
          (hook) => hook.method === 'create',
          authenticate('jwt')
        )
      ],
      find: [],
      get: [],
      create: [
        // Sets `hook.params.existingUser` to the existing user.
        // Also sets hook.result to only contain the passed-in email.
        isExistingUser(),
        iff(
          hook => !hook.params.existingUser,
          // If the user has passed a password for account creation, delete it.
          discard('password'),
          createTemporaryPassword({
            hashedPasswordField: 'tempPassword',
            plainPasswordField: 'tempPasswordPlain'
          }),
          generateSalt({ randomBytes }),
          hashPassword({ pbkdf2, passwordField: 'tempPassword', timeStampField: 'tempPasswordCreatedAt' })
        )
      ],
      update: [
        // If a password is provided, hash it and generate a salt.
        iff(
          hook => hook.data && hook.data.password,
          generateSalt({ randomBytes }),
          hashPassword({ randomBytes, pbkdf2 })
        )
      ],
      patch: [
        // If a password is provided, hash it and generate a salt.
        iff(
          hook => hook.data && hook.data.password,
          generateSalt({ randomBytes }),
          hashPassword({ randomBytes, pbkdf2 })
        )
      ],
      remove: [
        // disallow('external')
      ]
    },

    after: {
      all: [],
      find: [],
      get: [],
      create: [
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
        ),
        // Set the response to just the email, so there's no way for a malicious user
        // to know if this email address is already being used for another account.
        hook => {
          hook.result = { email: hook.data.email };
        }
      ],
      update: [],
      patch: [],
      remove: []
    },

    error: {
      all: [
        error => {
          console.log(error);
        }
      ],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  };
};
