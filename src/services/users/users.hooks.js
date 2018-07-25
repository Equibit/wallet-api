const { authenticate } = require('feathers-authentication').hooks
const { restrictToOwner } = require('feathers-authentication-hooks')
const { iff, unless, keep, discard, disallow, isProvider, lowerCase, preventChanges } = require('feathers-hooks-common')
const { generateSalt, hashPassword } = require('feathers-authentication-signed').hooks
const { randomBytes, pbkdf2 } = require('crypto')
const errors = require('feathers-errors')

const sendEmailVerificationCode = require('./hooks/hook.email.verification-code')
const restrict2ndFactor = require('./hooks/hook.restrict-2nd-factor')
const checkCodeHash = require('./hooks/hook.check-code-hash')
const isExistingUser = require('./hooks/hook.is-existing-user')
const createTemporaryPassword = require('./hooks/hook.create-temp-password')
const removeIsNewUser = require('./hooks/hook.remove-is-new-user')
const removeTempPassword = require('./hooks/hook.remove-temp-password')
const enforcePastPasswordPolicy = require('./hooks/hook.password.past-policy')
const sendWelcomeEmail = require('./hooks/hook.email.welcome')
const sendDuplicateSignupEmail = require('./hooks/hook.email.duplicate-signup')
const verifyOldPassword = require('./hooks/hook.password.verify-old-password')
const rejectEmptyPassword = require('./hooks/hook.password.reject-empty-password')
const mapUpdateToPatch = require('../../hooks/map-update-to-patch')
const createReferralInfo = require('./hooks/hook.create-referral-info')
const mnemonicHash = require('./hooks/hook.mnemonic-hash')

function findUser (options) {
  return function (hook) {
    return hook.service.get(hook.id).then(user => {
      hook.user = user
      return hook
    })
  }
}

function hasAny (fields = []) {
  return function (hook) {
    let found = false
    fields.forEach(function (field) {
      if (field in hook.data) {
        found = true
      }
    })
    return found
  }
}

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
        iff(
          // for seeding purposes
          hook => hook.params.internal
        ).else(
          // the only things the user is allowed to choose for their
          // account (on creation)
          keep('email', 'autoLogoutTime', 'referral'),
          lowerCase('email'),
          // Sets `hook.params.existingUser` to the existing user.
          // Also sets hook.result to only contain the passed-in email.
          isExistingUser(),
          iff(
            hook => !hook.params.existingUser,
            createTemporaryPassword({
              passwordField: 'tempPassword',
              plainPasswordField: 'tempPasswordPlain',
              timeStampField: 'tempPasswordCreatedAt'
            }),
            generateSalt({ randomBytes }),
            hashPassword({ pbkdf2, passwordField: 'tempPassword' })
          )
        )
      ],
      update: [mapUpdateToPatch()],
      patch: [
        findUser(),
        iff(
          isProvider('external'),
          // Don't allow external queries to set the 2FA validated or email verified state
          preventChanges(true, 'twoFactorValidatedSession', 'emailVerified'),
          // Require two-factor for email changes
          // Restrict two-factor code submission to not allow other changes.
          iff(
            hasAny(['email', 'emailVerificationCode', 'twoFactorCode', 'hasRecordedMnemonic']),
            restrict2ndFactor()
          )
        ),
        lowerCase('email'),
        // If a password is provided, hash it and generate a salt.
        iff(
          hook => hook.data.requestPasswordChange,
          rejectEmptyPassword({
            passwordField: 'oldPassword',
            saltField: 'salt'
          }),
          verifyOldPassword({ pbkdf2 }),
          generateSalt({ randomBytes }),
          hook => {
            hook.data = {
              provisionalSalt: hook.data.salt
            }
          }
        ),
        iff(
          hook => hook.data && hook.data.password,
          iff(
            isProvider('external'),
            hook => {
              if (!hook.data.salt || (!hook.user.tempPassword && hook.data.salt !== hook.user.provisionalSalt)) {
                throw new errors.BadRequest({
                  message: `salt was not supplied or did not match the provisional one`,
                  errors: {
                    salt: hook.data.salt ? 'Salt did not match provisionalSalt' : 'Salt is missing',
                    provisionalSalt: hook.user.provisionalSalt || 'Provisional salt is not available'
                  }
                })
              }
            }
          ),
          hook => {
            hook.data.salt = hook.user.provisionalSalt || hook.data.salt || hook.user.salt
            hook.data.provisionalSalt = ''
          },
          rejectEmptyPassword({
            passwordField: 'password',
            saltField: 'provisionalSalt'
          }),
          enforcePastPasswordPolicy({
            oldPasswordsAttr: 'pastPasswordHashes',
            passwordCount: 3
          }),
          hashPassword({ randomBytes, pbkdf2 }),
          removeIsNewUser(),
          removeTempPassword(),
          // Used the temp password to login, which was sent via email.
          //  This verifies the email address as well.
          hook => {
            if (hook.user.tempPassword) {
              hook.data.emailVerified = true
            } else {
              delete hook.data.emailVerified
            }
            hook.user.tempPasswordCreatedAt = undefined
            hook.data.passwordCreatedAt = Date.now()
          },
          // Note: when password is changed we need to update the encrypted key and mnemonic.
          // On password change, ignore any changes not related to this flow
          keep(
            'password',
            'passwordCreatedAt',
            'salt',
            'provisionalSalt',
            'pastPasswordHashes',
            'requestPasswordChange',
            'tempPassword',
            'tempPasswordCreatedAt',
            'isNewUser',
            'encryptedKey',
            'encryptedMnemonic',
            'emailVerified'
          )
        ).else(
          // User changes email address
          // - Create verification code using same mechanism as temporary passwords
          // - Set hash of code in user object.
          // - Email plaintext to user
          // - This could be part of other update operations, so don't eliminate other keys
          iff(
            hook => hook.data && hook.data.email && (hook.data.email !== hook.user.email || !hook.user.emailVerified),
            hook => {
              hook.data.emailVerified = false
              return hook
            },
            createTemporaryPassword({
              passwordField: 'emailVerificationCode',
              plainPasswordField: 'emailVerificationCodePlain'
            }),
            iff(
              hook => hook.app.get('postmark').key !== 'POSTMARK_API_TEST',
              sendEmailVerificationCode({
                From: outboundEmail,
                TemplateId: emailTemplates.newEmailVerification,
                templateCodeField: 'emailVerificationCode',
                dataCodeField: 'emailVerificationCodePlain'
              })
            ),
            hook => {
              delete hook.data.emailVerificationCodePlain
              return hook
            }
          ).else(
            // User has sent email address verification code.
            // - Check hash of code
            // - set emailVerified to true
            // - Take no other actions.
            iff(
              hook => hook.data && hook.data.emailVerificationCode,
              checkCodeHash({ dataToHashField: 'emailVerificationCode', hashedDataField: 'emailVerificationCode' }),
              hook => {
                hook.data = {
                  emailVerified: true,
                  emailVerificationCode: null
                }
                return hook
              }
            )
          ),
          // User requests 2FA code (automatic when clicking Edit in preferences)
          // - this should be the only action taken in updates, so delete all other fields in the patch,
          //    including the flag to request the two factor code
          iff(
            hook => hook.data && hook.data.requestTwoFactorCode,
            createTemporaryPassword({ passwordField: 'twoFactorCode', plainPasswordField: 'twoFactorCodePlain' }),
            iff(
              hook => hook.app.get('postmark').key !== 'POSTMARK_API_TEST',
              sendEmailVerificationCode({
                From: outboundEmail,
                TemplateId: emailTemplates.twoFactorAuthentication,
                emailAddressFromUserRecord: true,
                templateCodeField: 'twoFactorCode',
                dataCodeField: 'twoFactorCodePlain'
              })
            ),
            hook => { hook.data.twoFactorValidatedSession = false; return hook },
            keep('twoFactorValidatedSession', 'twoFactorCode')
          ).else(
            // User submits two factor code for verification
            // - this should be the only action taken in updates, so delete all other fields in the patch
            iff(
              hook => hook.data && hook.data.twoFactorCode,
              checkCodeHash({ dataToHashField: 'twoFactorCode', hashedDataField: 'twoFactorCode' }),
              hook => {
                // Currently we store this validated session flag until next login, at which time
                //  the flag is cleared, so a returning user must revalidate.  However, suggestions
                //  from the issue for this feature
                //  https://github.com/Equibit/wallet-api/issues/26#issuecomment-315762926
                //  prefer to have a per-request 2FA session that doesn't persist. so
                //  TODO: examine whether it would be preferable to
                //    (1) do checkCodeHash() but set no flag when doing 2FA (to validate code)
                //      (this would remove twoFactorValidatedSession entirely)
                //    (2) receive and verify (via checkCodeHash) the 2FA code when changing email.
                //    (3) clear twoFactorCode after changing email
                //    (4) NOT require 2FA for *verifying* email
                hook.data = {
                  twoFactorValidatedSession: true,
                  twoFactorCode: null
                }
                return hook
              }
            )
          )
        ),
        hook => { hook.data.updatedAt = Date.now() },

        // The `mnemonicHash` value can be passed either for saving to db or for verification.
        // - Allow to set mnemonicHash only when encrypted key and mnemonic are generated for the 1st time
        // - Verify mnemonicHash and immediately return the result of verification.
        iff(
          hook => (hook.data && hook.data.mnemonicHash),
          mnemonicHash()
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
          discard(
            'password',
            'failedLogins',
            'challenge',
            'tempPassword',
            'pastPasswordHashes',
            'encryptedKey',
            'encryptedMnemonic',
            'mnemonicHash',
            'twoFactorCode',
            'emailVerificationCode'
          ),
          // don't remove salt for update and patch
          iff(
            context => context.method !== 'update' && context.method !== 'patch',
            discard('salt', 'provisionalSalt')
          )
        )
      ],
      find: [],
      get: [],
      create: [
        // Only send emails if we're not using a test account.
        iff(
          hook => hook.app.get('postmark').key !== 'POSTMARK_API_TEST' && hook.app.get('env') !== 'testing',
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
        },
        iff(
          hook => 'referral' in hook.data,
          createReferralInfo()
        )
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
