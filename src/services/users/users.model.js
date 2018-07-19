'use strict'

// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const users = new mongooseClient.Schema({
    email: {type: String, unique: true, lowercase: true},
    password: { type: String },
    passwordCreatedAt: { type: Date },
    tempPassword: { type: String },
    tempPasswordCreatedAt: { type: Date },
    pastPasswordHashes: [ String ],
    salt: { type: String }, // Salt is shared between both passwords.
    provisionalSalt: { type: String }, // Salt for *next* password
    challenge: { type: String },
    twoFactor: {
      sms: { type: Boolean }
    },
    failedLogins: [{
      date: Date,
      sendEmail: Boolean
    }],
    isNewUser: { type: Boolean, default: true },
    encryptedKey: { type: String },
    encryptedMnemonic: { type: String },
    // SHA3_512 hash(email + mnemonic) to verify mnemonic when user uses Forgot Password flow to restore the keys.
    mnemonicHash: { type: String },
    hasRecordedMnemonic: { type: Boolean, default: false },
    twoFactorCode: { type: String },
    twoFactorValidatedSession: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerified: { type: Boolean, default: false },
    autoLogoutTime: { type: Number, default: 300000 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    versionKey: false
  })

  return mongooseClient.model('users', users)
}
