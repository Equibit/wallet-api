const { authenticate } = require('feathers-authentication').hooks;
const { iff, unless } = require('feathers-hooks-common');
const { generateSalt, hashPassword } = require('feathers-authentication-signed').hooks;
const { randomBytes, pbkdf2 } = require('crypto');
const { createHash } = require('feathers-authentication-signed/utils');

module.exports = {
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
      // Check if the user already exists.
      hook => {
        let userService = hook.service;
        userService.find({email: hook.data.email})
          .then(users => {
            users = users.data || users;
            let user = users[0];
            // User already signed up.
            if (user) {
              hook.params.existingUser = user;
              // Set hook.result, so the call to the database will be skipped.
              hook.result = { email: hook.data.email };
            }

            return hook;
          });
      },
      unless(
        hook => hook.params.existingUser,
        // Create temporary password for new signups.
        hook => {
          // create a random string which is the user's plain-text tempPassword.
          let tempPassword = randomBytes(10);
          // run tempPassword through the hashPassword hook.
          hook.data.tempPassword = createHash(tempPassword);
          // If user has passed a password for account creation, delete it.
          delete hook.data.password;
        },
        generateSalt({ randomBytes }),
        hashPassword({ pbkdf2, passwordField: 'tempPassword' })
      )
    ],
    update: [
      iff(
        hook => hook.data && hook.data.password,
        generateSalt({ randomBytes }),
        hashPassword({ randomBytes, pbkdf2 })
      )
    ],
    patch: [
      iff(
        hook => hook.data && hook.data.password,
        generateSalt({ randomBytes }),
        hashPassword({ randomBytes, pbkdf2 })
      )
    ],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      iff(
        hook => hook.params.existingUser,
        hook => {
          // Send notification email to existing user
          return hook;
        }
      ).else(
        hook => {
          // Send signup email with hook.data.tempPassword
          return hook;
        }
      ),
      // Set the response to just the email, so there's no way for a malicious user
      // to know if this email address is already being used for an account.
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
